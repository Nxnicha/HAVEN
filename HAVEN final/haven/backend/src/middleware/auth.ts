import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";

export type AuthUser = { id: string; role: "RESIDENT" | "ADMIN"; roomId: string | null };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ใส่เฉพาะข้อมูลที่จำเป็นใน token (ห้ามใส่ passwordHash)
export const signToken = (u: AuthUser) =>
  jwt.sign({ id: u.id, role: u.role, roomId: u.roomId } satisfies AuthUser, env.JWT_SECRET, { expiresIn: "7d" });

/** อ่าน token ถ้ามี (ใช้กับ route ที่ผู้เข้าชมทั่วไปก็เรียกได้) */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(h.slice(7), env.JWT_SECRET) as AuthUser;
    } catch {
      /* ignore invalid token for optional routes */
    }
  }
  next();
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });
  let payload: AuthUser;
  try {
    payload = jwt.verify(h.slice(7), env.JWT_SECRET) as AuthUser;
  } catch {
    return res.status(401).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
  // อ่าน role/roomId ล่าสุดจากฐานข้อมูล (เผื่อแอดมินเพิ่งผูกห้องให้)
  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, role: true, roomId: true } });
  if (!user) return res.status(401).json({ message: "ไม่พบบัญชีผู้ใช้" });
  req.user = user;
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "เฉพาะผู้ดูแลระบบ" });
  next();
};
