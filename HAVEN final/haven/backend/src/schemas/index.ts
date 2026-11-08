import { z } from "zod";

// ---------- Auth ----------
export const RegisterSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
  name: z.string().min(2, "กรุณากรอกชื่อ"),
  phone: z.string().regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง").optional(),
});
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------- Rooms ----------
export const RoomQuerySchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
  type: z.string().optional(),
  maxRent: z.coerce.number().int().positive().optional(),
});
export const RoomCreateSchema = z.object({
  number: z.string().min(1),
  floor: z.number().int().min(1),
  type: z.string().min(1),
  sizeSqm: z.number().positive(),
  monthlyRent: z.number().int().positive(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).default("AVAILABLE"),
  description: z.string().optional(),
  imageUrl: z.string().min(1).optional(), // URL เต็ม หรือ path ใน public เช่น /images/room-101.jpg
});
export const RoomUpdateSchema = RoomCreateSchema.partial();

// ---------- Bookings ----------
export const BookingCreateSchema = z
  .object({
    roomId: z.string().min(1),
    guestName: z.string().min(2, "กรุณากรอกชื่อ"),
    guestEmail: z.string().email("อีเมลไม่ถูกต้อง"),
    guestPhone: z.string().regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง"),
    type: z.enum(["VIEWING", "RENT"]),
    startDate: z.coerce.date().refine((d) => d.getTime() > Date.now() - 86_400_000, "วันที่ต้องไม่ย้อนหลัง"),
    months: z.number().int().min(1).max(36).optional(),
    note: z.string().max(500).optional(),
  })
  .refine((b) => b.type !== "RENT" || !!b.months, { message: "กรุณาระบุจำนวนเดือนที่เช่า", path: ["months"] });
export const BookingStatusSchema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]) });

// ---------- Bills ----------
export const BillCreateSchema = z
  .object({
    roomId: z.string().min(1),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "รูปแบบเดือน YYYY-MM"),
    waterPrev: z.number().int().min(0),
    waterCurr: z.number().int().min(0),
    elecPrev: z.number().int().min(0),
    elecCurr: z.number().int().min(0),
    waterRate: z.number().positive().default(18),
    elecRate: z.number().positive().default(7),
    commonFee: z.number().int().min(0).default(0),
    dueDate: z.coerce.date(),
  })
  .refine((b) => b.waterCurr >= b.waterPrev, { message: "มิเตอร์น้ำปัจจุบันต้อง ≥ ครั้งก่อน", path: ["waterCurr"] })
  .refine((b) => b.elecCurr >= b.elecPrev, { message: "มิเตอร์ไฟปัจจุบันต้อง ≥ ครั้งก่อน", path: ["elecCurr"] });
export const PaySchema = z.object({ method: z.enum(["PROMPTPAY", "CARD", "CASH"]) });

// ---------- Parking ----------
export const SlotUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).optional(),
  assignedUserId: z.string().nullable().optional(),
});
export const ParkingEntrySchema = z.object({
  slotCode: z.string().min(1),
  plate: z.string().min(2, "กรุณากรอกทะเบียนรถ"),
});
export const ParkingExitSchema = z.object({ slotCode: z.string().min(1) });

// ---------- Parcels ----------
export const ParcelCreateSchema = z.object({
  trackingNo: z.string().min(4),
  carrier: z.string().min(2),
  roomNumber: z.string().min(1),
  note: z.string().optional(),
});

// ---------- Users ----------
export const AssignRoomSchema = z.object({ roomId: z.string().min(1).nullable() });

// ---------- Benefits ----------
export const BenefitCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  category: z.string().min(2),
  partner: z.string().optional(),
  discount: z.string().optional(),
  validUntil: z.coerce.date().optional(),
});
