import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { env } from "./lib/env";
import auth from "./routes/auth";
import rooms from "./routes/rooms";
import bookings from "./routes/bookings";
import bills from "./routes/bills";
import parking from "./routes/parking";
import parcels from "./routes/parcels";
import benefits from "./routes/benefits";
import ai from "./routes/ai";
import notifications from "./routes/notifications";
import users from "./routes/users";

export const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "HAVEN API" }));
app.use("/api/auth", auth);
app.use("/api/rooms", rooms);
app.use("/api/bookings", bookings);
app.use("/api/bills", bills);
app.use("/api/parking", parking);
app.use("/api/parcels", parcels);
app.use("/api/benefits", benefits);
app.use("/api/ai", ai);
app.use("/api/notifications", notifications);
app.use("/api/users", users);

app.use((_req, res) => res.status(404).json({ message: "ไม่พบ endpoint" }));

// Express 5 ส่ง error จาก async handler มาที่นี่อัตโนมัติ
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ message: "ข้อมูลซ้ำในระบบ" });
    if (err.code === "P2025") return res.status(404).json({ message: "ไม่พบข้อมูล" });
  }
  console.error(err);
  res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
});
