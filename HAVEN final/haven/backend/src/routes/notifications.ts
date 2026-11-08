import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const r = Router();
r.use(requireAuth);

r.get("/", async (req, res) => {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
  ]);
  res.json({ items, unread });
});

r.patch("/read-all", async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
  res.json({ ok: true });
});

r.patch("/:id/read", async (req, res) => {
  await prisma.notification.updateMany({ where: { id: String(req.params.id), userId: req.user!.id }, data: { read: true } });
  res.json({ ok: true });
});

export default r;
