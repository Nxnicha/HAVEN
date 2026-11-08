import { Router } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { ParcelCreateSchema } from "../schemas";
import { notifyUser } from "../lib/notify";

const r = Router();
r.use(requireAuth);

r.get("/", async (req, res) => {
  const where = req.user!.role === "ADMIN" ? {} : { recipientUserId: req.user!.id };
  res.json(
    await prisma.parcel.findMany({
      where,
      include: { room: { select: { number: true } }, recipient: { select: { name: true } } },
      orderBy: { receivedAt: "desc" },
    }),
  );
});

// นิติบุคคลบันทึกพัสดุเข้า
r.post("/", requireAdmin, validate(ParcelCreateSchema), async (_req, res) => {
  const { roomNumber, ...data } = res.locals.body;
  const room = await prisma.room.findUnique({ where: { number: roomNumber }, include: { residents: true } });
  if (!room || room.residents.length === 0)
    return res.status(404).json({ message: "ไม่พบห้องหรือห้องนี้ไม่มีผู้อยู่อาศัย" });
  const parcel = await prisma.parcel.create({
    data: { ...data, roomId: room.id, recipientUserId: room.residents[0].id },
  });
  await notifyUser(parcel.recipientUserId, { title: "พัสดุมาถึงแล้ว", message: `${parcel.carrier} เลข ${parcel.trackingNo} รับได้ที่ห้องนิติบุคคล`, link: "/parcels" });
  res.status(201).json(parcel);
});

r.patch("/:id/pickup", async (req, res) => {
  const parcel = await prisma.parcel.findUnique({ where: { id: String(req.params.id) } });
  if (!parcel) return res.status(404).json({ message: "ไม่พบพัสดุ" });
  if (req.user!.role !== "ADMIN" && parcel.recipientUserId !== req.user!.id)
    return res.status(403).json({ message: "ไม่ใช่พัสดุของคุณ" });
  res.json(
    await prisma.parcel.update({ where: { id: parcel.id }, data: { status: "PICKED_UP", pickedUpAt: new Date() } }),
  );
});

export default r;
