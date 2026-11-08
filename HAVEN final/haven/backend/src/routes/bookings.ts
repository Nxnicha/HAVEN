import { Router } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";
import { BookingCreateSchema, BookingStatusSchema } from "../schemas";
import { notifyAdmins, notifyUser } from "../lib/notify";

const r = Router();

// ผู้เข้าชมจองนัดชมห้อง/จองเช่าได้ (ไม่บังคับล็อกอิน)
r.post("/", optionalAuth, validate(BookingCreateSchema), async (req, res) => {
  const data = res.locals.body;
  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) return res.status(404).json({ message: "ไม่พบห้อง" });
  if (data.type === "RENT" && room.status !== "AVAILABLE")
    return res.status(409).json({ message: "ห้องนี้ไม่ว่างสำหรับการเช่า" });
  const booking = await prisma.booking.create({ data: { ...data, userId: req.user?.id } });
  await notifyAdmins({
    title: data.type === "RENT" ? "คำขอเช่าห้องใหม่" : "นัดชมห้องใหม่",
    message: `${data.guestName} ${data.type === "RENT" ? "ขอเช่า" : "ขอนัดชม"}ห้อง ${room.number}`,
    link: "/bookings",
  });
  res.status(201).json(booking);
});

r.get("/", requireAuth, async (req, res) => {
  const where = req.user!.role === "ADMIN" ? {} : { userId: req.user!.id };
  res.json(
    await prisma.booking.findMany({ where, include: { room: true }, orderBy: { createdAt: "desc" } }),
  );
});

r.patch("/:id/status", requireAuth, requireAdmin, validate(BookingStatusSchema), async (req, res) => {
  const booking = await prisma.booking.update({
    where: { id: String(req.params.id) },
    data: { status: res.locals.body.status },
    include: { room: { select: { number: true } } },
  });
  if (booking.userId && booking.status !== "PENDING")
    await notifyUser(booking.userId, {
      title: booking.status === "CONFIRMED" ? "การจองได้รับการอนุมัติ" : "การจองถูกยกเลิก",
      message: `การจองห้อง ${booking.room.number} ${booking.status === "CONFIRMED" ? "ได้รับการอนุมัติแล้ว" : "ถูกยกเลิก"}`,
      link: "/bookings",
    });
  // ยืนยันการเช่า -> เปลี่ยนสถานะห้องเป็นมีผู้เช่า
  if (booking.status === "CONFIRMED" && booking.type === "RENT")
    await prisma.room.update({ where: { id: booking.roomId }, data: { status: "OCCUPIED" } });
  res.json(booking);
});

export default r;
