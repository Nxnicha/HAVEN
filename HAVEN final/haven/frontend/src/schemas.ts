import { z } from "zod";

/** Zod schema ฝั่ง frontend ใช้ตรวจสอบฟอร์มก่อนส่ง และตรวจ response จาก API */

export const LoginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const RegisterSchema = LoginSchema.extend({
  name: z.string().min(2, "กรุณากรอกชื่อ"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
  phone: z.string().regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง").optional().or(z.literal("").transform(() => undefined)),
});

export const BookingFormSchema = z
  .object({
    guestName: z.string().min(2, "กรุณากรอกชื่อ"),
    guestEmail: z.string().email("อีเมลไม่ถูกต้อง"),
    guestPhone: z.string().regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง"),
    type: z.enum(["VIEWING", "RENT"]),
    startDate: z.string().min(1, "กรุณาเลือกวันที่"),
    months: z.coerce.number().int().min(1).max(36).optional(),
    note: z.string().max(500).optional(),
  })
  .refine((b) => b.type !== "RENT" || !!b.months, { message: "กรุณาระบุจำนวนเดือน", path: ["months"] });

export const ParcelFormSchema = z.object({
  trackingNo: z.string().min(4, "เลขพัสดุอย่างน้อย 4 ตัว"),
  carrier: z.string().min(2, "กรุณาระบุบริษัทขนส่ง"),
  roomNumber: z.string().min(1, "กรุณาระบุเลขห้อง"),
});

// ---------- Response types ----------
export const RoomSchema = z.object({
  id: z.string(),
  number: z.string(),
  floor: z.number(),
  type: z.string(),
  sizeSqm: z.number(),
  monthlyRent: z.number(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
});
export type Room = z.infer<typeof RoomSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(["RESIDENT", "ADMIN"]),
  roomId: z.string().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export type Bill = {
  id: string; month: string; room: { number: string };
  waterPrev: number; waterCurr: number; elecPrev: number; elecCurr: number;
  waterAmount: number; elecAmount: number; commonFee: number; total: number;
  status: "UNPAID" | "PAID" | "OVERDUE"; dueDate: string;
};
export type Slot = {
  id: string; code: string; zone: string; type: "CAR" | "MOTORCYCLE" | "EV";
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED"; mine?: boolean; assignedUser: { name: string } | null;
};
export type Parcel = {
  id: string; trackingNo: string; carrier: string; receivedAt: string; pickedUpAt: string | null;
  status: "WAITING" | "PICKED_UP"; room: { number: string }; recipient: { name: string };
};
export type Benefit = {
  id: string; title: string; description: string; category: string; partner: string | null; discount: string | null;
};

/** แปลง Zod error เป็น { field: message } สำหรับแสดงใต้ input */
export const fieldErrors = (e: z.ZodError) =>
  Object.fromEntries(Object.entries(e.flatten().fieldErrors).map(([k, v]) => [k, (v as string[] | undefined)?.[0] ?? ""]));
