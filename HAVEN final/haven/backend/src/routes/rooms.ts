import { Router } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { RoomCreateSchema, RoomQuerySchema, RoomUpdateSchema } from "../schemas";

const r = Router();

// ผู้เข้าชมทั่วไปดูรายการห้องได้โดยไม่ต้องล็อกอิน
r.get("/", validate(RoomQuerySchema, "query"), async (_req, res) => {
  const { status, type, maxRent } = res.locals.query;
  const rooms = await prisma.room.findMany({
    where: { status, type, monthlyRent: maxRent ? { lte: maxRent } : undefined },
    orderBy: [{ floor: "asc" }, { number: "asc" }],
  });
  res.json(rooms);
});

r.get("/:id", async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: String(req.params.id) } });
  if (!room) return res.status(404).json({ message: "ไม่พบห้อง" });
  res.json(room);
});

r.post("/", requireAuth, requireAdmin, validate(RoomCreateSchema), async (_req, res) => {
  res.status(201).json(await prisma.room.create({ data: res.locals.body }));
});

r.patch("/:id", requireAuth, requireAdmin, validate(RoomUpdateSchema), async (req, res) => {
  res.json(await prisma.room.update({ where: { id: String(req.params.id) }, data: res.locals.body }));
});

export default r;
