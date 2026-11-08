import { Router } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { ParkingEntrySchema, ParkingExitSchema, SlotUpdateSchema } from "../schemas";

const r = Router();

// สรุปจำนวนที่ว่าง (ผู้เข้าชมก็ดูได้)
r.get("/summary", async (_req, res) => {
  const groups = await prisma.parkingSlot.groupBy({ by: ["type", "status"], _count: true });
  res.json(groups.map((g) => ({ type: g.type, status: g.status, count: g._count })));
});

r.get("/slots", requireAuth, async (req, res) => {
  const slots = await prisma.parkingSlot.findMany({
    orderBy: { code: "asc" },
    include: { assignedUser: { select: { name: true } } },
  });
  // ผู้อยู่อาศัยเห็นเฉพาะชื่อเจ้าของช่องของตัวเอง
  if (req.user!.role !== "ADMIN")
    return res.json(
      slots.map((s) => ({ ...s, assignedUser: s.assignedUserId === req.user!.id ? s.assignedUser : null, mine: s.assignedUserId === req.user!.id })),
    );
  res.json(slots);
});

r.patch("/slots/:id", requireAuth, requireAdmin, validate(SlotUpdateSchema), async (req, res) => {
  res.json(await prisma.parkingSlot.update({ where: { id: String(req.params.id) }, data: res.locals.body }));
});

// บันทึกรถเข้า (เช่น จากกล้องอ่านป้ายทะเบียน/รปภ.)
r.post("/entry", requireAuth, requireAdmin, validate(ParkingEntrySchema), async (_req, res) => {
  const { slotCode, plate } = res.locals.body;
  const slot = await prisma.parkingSlot.findUnique({ where: { code: slotCode } });
  if (!slot) return res.status(404).json({ message: "ไม่พบช่องจอด" });
  if (slot.status === "OCCUPIED") return res.status(409).json({ message: "ช่องนี้มีรถจอดอยู่" });
  const [log] = await prisma.$transaction([
    prisma.parkingLog.create({ data: { slotId: slot.id, plate } }),
    prisma.parkingSlot.update({ where: { id: slot.id }, data: { status: "OCCUPIED" } }),
  ]);
  res.status(201).json(log);
});

r.post("/exit", requireAuth, requireAdmin, validate(ParkingExitSchema), async (_req, res) => {
  const slot = await prisma.parkingSlot.findUnique({ where: { code: res.locals.body.slotCode } });
  if (!slot) return res.status(404).json({ message: "ไม่พบช่องจอด" });
  const open = await prisma.parkingLog.findFirst({ where: { slotId: slot.id, exitAt: null }, orderBy: { entryAt: "desc" } });
  await prisma.$transaction([
    ...(open ? [prisma.parkingLog.update({ where: { id: open.id }, data: { exitAt: new Date() } })] : []),
    prisma.parkingSlot.update({
      where: { id: slot.id },
      data: { status: slot.assignedUserId ? "RESERVED" : "AVAILABLE" },
    }),
  ]);
  res.json({ ok: true });
});

export default r;
