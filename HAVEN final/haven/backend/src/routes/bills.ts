import { Router } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { BillCreateSchema, PaySchema } from "../schemas";
import { notifyAdmins, notifyRoom } from "../lib/notify";

const r = Router();
r.use(requireAuth);

/** คำนวณค่าน้ำค่าไฟจากเลขมิเตอร์ */
export const calcBill = (b: {
  waterPrev: number; waterCurr: number; elecPrev: number; elecCurr: number;
  waterRate: number; elecRate: number; commonFee: number;
}) => {
  const waterAmount = (b.waterCurr - b.waterPrev) * b.waterRate;
  const elecAmount = (b.elecCurr - b.elecPrev) * b.elecRate;
  return { waterAmount, elecAmount, total: waterAmount + elecAmount + b.commonFee };
};

r.get("/", async (req, res) => {
  const isAdmin = req.user!.role === "ADMIN";
  if (!isAdmin && !req.user!.roomId) return res.json([]);
  // อัปเดตบิลที่เลยกำหนดเป็น OVERDUE อัตโนมัติ
  await prisma.utilityBill.updateMany({
    where: { status: "UNPAID", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });
  const bills = await prisma.utilityBill.findMany({
    where: isAdmin ? {} : { roomId: req.user!.roomId! },
    include: { room: { select: { number: true } }, payments: true },
    orderBy: { month: "desc" },
  });
  res.json(bills);
});

r.post("/", requireAdmin, validate(BillCreateSchema), async (_req, res) => {
  const body = res.locals.body;
  const bill = await prisma.utilityBill.create({ data: { ...body, ...calcBill(body) } });
  await notifyRoom(bill.roomId, { title: "บิลใหม่", message: `บิลค่าน้ำ-ไฟเดือน ${bill.month} ยอด ${bill.total.toLocaleString()} บาท`, link: "/bills" });
  res.status(201).json(bill);
});

r.post("/:id/pay", validate(PaySchema), async (req, res) => {
  const id = String(req.params.id);
  const bill = await prisma.utilityBill.findUnique({ where: { id }, include: { room: { select: { number: true } } } });
  if (!bill) return res.status(404).json({ message: "ไม่พบบิล" });
  if (req.user!.role !== "ADMIN" && bill.roomId !== req.user!.roomId)
    return res.status(403).json({ message: "ไม่ใช่บิลของห้องคุณ" });
  if (bill.status === "PAID") return res.status(409).json({ message: "ชำระแล้ว" });

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: { billId: bill.id, userId: req.user!.id, amount: bill.total, method: res.locals.body.method },
    }),
    prisma.utilityBill.update({ where: { id: bill.id }, data: { status: "PAID" } }),
  ]);
  await notifyAdmins({ title: "ชำระเงินแล้ว", message: `ห้อง ${bill.room.number} ชำระบิลเดือน ${bill.month} ${bill.total.toLocaleString()} บาท`, link: "/bills" });
  res.status(201).json(payment);
});

export default r;
