import { Router } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { AssignRoomSchema } from "../schemas";
import { notifyUser } from "../lib/notify";

const r = Router();
r.use(requireAuth, requireAdmin);

// รายชื่อสมาชิกทั้งหมด (แอดมิน)
r.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, room: { select: { id: true, number: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

// ผูกห้องให้สมาชิก (roomId = null คือยกเลิกการผูก)
r.patch("/:id/room", validate(AssignRoomSchema), async (req, res) => {
  const { roomId } = res.locals.body as { roomId: string | null };
  const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

  let roomNumber: string | null = null;
  if (roomId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ message: "ไม่พบห้อง" });
    roomNumber = room.number;
    await prisma.room.update({ where: { id: roomId }, data: { status: "OCCUPIED" } });
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { roomId } });

  await notifyUser(user.id, roomNumber
    ? { title: "ผูกห้องพักสำเร็จ", message: `บัญชีของคุณผูกกับห้อง ${roomNumber} แล้ว ใช้งานบิล พัสดุ และสิทธิประโยชน์ได้เลย`, link: "/dashboard" }
    : { title: "ยกเลิกการผูกห้อง", message: "บัญชีของคุณไม่ได้ผูกกับห้องพักแล้ว", link: "/dashboard" });
  res.json({ id: updated.id, roomId: updated.roomId });
});

export default r;
