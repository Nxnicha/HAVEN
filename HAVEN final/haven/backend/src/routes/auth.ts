import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { requireAuth, signToken } from "../middleware/auth";
import { LoginSchema, RegisterSchema } from "../schemas";
import { notifyAdmins } from "../lib/notify";

const r = Router();

const publicUser = (u: { id: string; email: string; name: string; phone: string | null; role: "RESIDENT" | "ADMIN"; roomId: string | null }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  role: u.role,
  roomId: u.roomId,
});

r.post("/register", validate(RegisterSchema), async (_req, res) => {
  const { email, password, name, phone } = res.locals.body;
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
  const user = await prisma.user.create({
    data: { email, name, phone, passwordHash: await bcrypt.hash(password, 10) },
  });
  await notifyAdmins({ title: "สมาชิกใหม่", message: `${name} (${email}) สมัครสมาชิก รอผูกห้องพัก`, link: "/admin/members" });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

r.post("/login", validate(LoginSchema), async (_req, res) => {
  const { email, password } = res.locals.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  res.json({ token: signToken(user), user: publicUser(user) });
});

r.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { room: true } });
  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
  res.json({ ...publicUser(user), room: user.room });
});

export default r;
