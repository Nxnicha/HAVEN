import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DAY = 86_400_000;

async function main() {
  await prisma.$transaction([
    prisma.benefitRedemption.deleteMany(), prisma.benefit.deleteMany(),
    prisma.payment.deleteMany(), prisma.utilityBill.deleteMany(),
    prisma.parkingLog.deleteMany(), prisma.parkingSlot.deleteMany(),
    prisma.parcel.deleteMany(), prisma.booking.deleteMany(),
    prisma.user.deleteMany(), prisma.room.deleteMany(),
  ]);

  // ห้อง 4 ชั้น ชั้นละ 6 ห้อง
  const types = [
    { type: "Studio", size: 24, rent: 8500 },
    { type: "1 Bedroom", size: 32, rent: 12000 },
    { type: "2 Bedroom", size: 55, rent: 22000 },
  ];
  const rooms = [];
  for (let floor = 1; floor <= 4; floor++)
    for (let i = 1; i <= 6; i++) {
      const t = types[(i - 1) % 3];
      rooms.push(
        await prisma.room.create({
          data: {
            number: `${floor}0${i}`, floor, type: t.type, sizeSqm: t.size,
            monthlyRent: t.rent + floor * 300,
            status: i <= 3 ? "OCCUPIED" : i === 6 && floor === 4 ? "MAINTENANCE" : "AVAILABLE",
            description: `ห้อง ${t.type} ชั้น ${floor} วิวเมือง เฟอร์นิเจอร์ครบ`,
          },
        }),
      );
    }

  const pw = await bcrypt.hash("password123", 10);
  await prisma.user.create({ data: { email: "admin@haven.com", passwordHash: pw, name: "นิติบุคคล HAVEN", role: "ADMIN" } });
  const occupied = rooms.filter((r) => r.status === "OCCUPIED");
  const residents = [];
  for (const [i, room] of occupied.entries())
    residents.push(
      await prisma.user.create({
        data: { email: i === 0 ? "resident@haven.com" : `resident${i}@haven.com`, passwordHash: pw, name: `ผู้พักอาศัย ${room.number}`, phone: `08100000${String(i).padStart(2, "0")}`, roomId: room.id },
      }),
    );

  // บิล 6 เดือนย้อนหลัง (ห้อง 101 เดือนล่าสุดใช้น้ำสูงผิดปกติ ให้ AI ตรวจจับได้)
  const months = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
  for (const room of occupied) {
    let w = 100, e = 1000;
    for (const [mi, month] of months.entries()) {
      const isLast = mi === months.length - 1;
      const wUse = room.number === "101" && isLast ? 48 : 10 + Math.floor(Math.random() * 5);
      const eUse = 150 + Math.floor(Math.random() * 40);
      const waterAmount = wUse * 18, elecAmount = eUse * 7, commonFee = 500;
      await prisma.utilityBill.create({
        data: {
          roomId: room.id, month, waterPrev: w, waterCurr: w + wUse, elecPrev: e, elecCurr: e + eUse,
          commonFee, waterAmount, elecAmount, total: waterAmount + elecAmount + commonFee,
          status: isLast ? "UNPAID" : "PAID",
          dueDate: new Date(Date.parse(`${month}-01`) + 40 * DAY),
        },
      });
      w += wUse; e += eUse;
    }
  }

  // ที่จอด 30 ช่อง
  const slots = [];
  for (let i = 1; i <= 30; i++) {
    const type = i <= 22 ? "CAR" : i <= 26 ? "MOTORCYCLE" : "EV";
    slots.push(
      await prisma.parkingSlot.create({
        data: { code: `B1-${String(i).padStart(2, "0")}`, zone: i <= 15 ? "A" : "B", floor: "B1", type, assignedUserId: residents[i - 1]?.id ?? null, status: residents[i - 1] ? "RESERVED" : "AVAILABLE" },
      }),
    );
  }
  // ประวัติรถเข้า-ออก 14 วัน (ช่วงเย็นเยอะ) + รถค้าง 3 วัน 1 คัน
  for (let d = 14; d >= 1; d--)
    for (let k = 0; k < 8; k++) {
      const hour = [7, 8, 18, 18, 19, 19, 20, 12][k];
      const entryAt = new Date(Date.now() - d * DAY);
      entryAt.setHours(hour, Math.floor(Math.random() * 60));
      await prisma.parkingLog.create({ data: { slotId: slots[k].id, plate: `กข ${1000 + k}`, entryAt, exitAt: new Date(entryAt.getTime() + 3 * 3_600_000) } });
    }
  for (const s of slots.slice(15, 21)) {
    await prisma.parkingSlot.update({ where: { id: s.id }, data: { status: "OCCUPIED" } });
    await prisma.parkingLog.create({ data: { slotId: s.id, plate: `ฮย ${s.code.slice(-2)}99`, entryAt: new Date(Date.now() - (s === slots[15] ? 3 * DAY : 2 * 3_600_000)) } });
  }

  // พัสดุ (บางชิ้นค้าง)
  const carriers = ["Kerry", "Flash", "ไปรษณีย์ไทย", "J&T", "Shopee Xpress"];
  for (const [i, u] of residents.entries()) {
    const days = [0, 1, 4, 8, 2, 10, 0, 5, 1, 0, 3, 6][i] ?? 0;
    await prisma.parcel.create({
      data: { trackingNo: `TH${100000 + i}`, carrier: carriers[i % carriers.length], recipientUserId: u.id, roomId: u.roomId!, receivedAt: new Date(Date.now() - days * DAY) },
    });
  }

  await prisma.benefit.createMany({
    data: [
      { title: "ฟิตเนส 24 ชม.", description: "ใช้ฟิตเนสชั้น 5 ฟรีตลอด 24 ชั่วโมง", category: "FACILITY" },
      { title: "สระว่ายน้ำ Infinity", description: "ใช้ฟรี 06:00-22:00 พาแขกได้ 2 คน/วัน", category: "FACILITY" },
      { title: "ส่วนลดร้านกาแฟชั้น 1", description: "ลด 15% ทุกเมนู", category: "PARTNER", partner: "Haven Café", discount: "15%" },
      { title: "ซักรีดราคาพิเศษ", description: "ลด 20% บริการซัก-อบ-รีด", category: "PARTNER", partner: "Clean Express", discount: "20%" },
      { title: "ชาร์จรถ EV ฟรีเดือนแรก", description: "สำหรับผู้เช่าใหม่", category: "PARKING", discount: "ฟรี 1 เดือน", validUntil: new Date(Date.now() + 60 * DAY) },
    ],
  });

  console.log("Seed เสร็จ: admin@haven.com / resident@haven.com (รหัส password123)");
}

main().finally(() => prisma.$disconnect());
