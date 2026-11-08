import { Router } from "express";
import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { BenefitCreateSchema } from "../schemas";

const r = Router();

// สิทธิประโยชน์ (ผู้เข้าชมเห็นได้ เพื่อใช้ประกอบการตัดสินใจเช่า)
r.get("/", async (_req, res) => {
  res.json(
    await prisma.benefit.findMany({
      where: { active: true, OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] },
      orderBy: { category: "asc" },
    }),
  );
});

r.get("/my", requireAuth, async (req, res) => {
  res.json(
    await prisma.benefitRedemption.findMany({
      where: { userId: req.user!.id },
      include: { benefit: true },
      orderBy: { redeemedAt: "desc" },
    }),
  );
});

r.post("/:id/redeem", requireAuth, async (req, res) => {
  if (!req.user!.roomId) return res.status(403).json({ message: "เฉพาะผู้พักอาศัยที่มีห้อง" });
  const benefit = await prisma.benefit.findUnique({ where: { id: String(req.params.id) } });
  if (!benefit || !benefit.active) return res.status(404).json({ message: "ไม่พบสิทธิประโยชน์" });
  const code = `HV-${randomBytes(3).toString("hex").toUpperCase()}`;
  res.status(201).json(
    await prisma.benefitRedemption.create({ data: { benefitId: benefit.id, userId: req.user!.id, code } }),
  );
});

r.post("/", requireAuth, requireAdmin, validate(BenefitCreateSchema), async (_req, res) => {
  res.status(201).json(await prisma.benefit.create({ data: res.locals.body }));
});

export default r;
