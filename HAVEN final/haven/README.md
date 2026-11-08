# HAVEN — ระบบเว็บไซต์คอนโดมิเนียม

เว็บไซต์คอนโดสำหรับ **ผู้เข้าชม** (ดูห้องว่าง/จองนัดชม/จองเช่า), **ผู้พักอาศัย** (ชำระค่าน้ำค่าไฟ, ติดตามพัสดุ, ที่จอดรถ, สิทธิประโยชน์) และ **นิติบุคคล** (AI ตรวจสอบที่จอดว่าง, พัสดุตกค้าง, ค่าน้ำไฟผิดปกติ)

## Tech Stack (ตามที่อาจารย์กำหนด)
| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React · TypeScript · Zod · Tailwind CSS · Axios (+ Vite, React Router) |
| Backend | Node.js · Express · TypeScript · Zod · Prisma · PostgreSQL |

## โครงสร้างโปรเจกต์
```
haven/
├── docker-compose.yml        # PostgreSQL 16
├── backend/
│   ├── prisma/schema.prisma  # 10 ตาราง: User, Room, Booking, UtilityBill, Payment, ParkingSlot, ParkingLog, Parcel, Benefit, BenefitRedemption
│   ├── prisma/seed.ts        # ข้อมูลตัวอย่าง (24 ห้อง, 30 ช่องจอด, บิล 6 เดือน, พัสดุ)
│   └── src/
│       ├── lib/              # prisma client, env (ตรวจด้วย Zod)
│       ├── middleware/       # JWT auth, validate (Zod)
│       ├── schemas/          # Zod schema ของทุก request
│       ├── routes/           # auth, rooms, bookings, bills, parking, parcels, benefits, ai
│       └── services/ai.ts    # AI วิเคราะห์ที่จอด / พัสดุ / ค่าน้ำไฟ
└── frontend/
    └── src/
        ├── api/client.ts     # Axios instance + interceptor แนบ JWT
        ├── schemas.ts        # Zod schema ฟอร์ม + type
        ├── auth.tsx          # AuthContext, Protected route
        └── pages/            # Home, RoomDetail, Login, Dashboard, Bills, Parking, Parcels, Benefits, Admin
```

## วิธีรัน
```bash
# 1) ฐานข้อมูล
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev            # http://localhost:4000

# 3) Frontend (อีก terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```
บัญชีทดสอบ: `resident@haven.com` / `admin@haven.com` รหัส `password123`

## API หลัก
| Method | Path | สิทธิ์ | รายละเอียด |
|---|---|---|---|
| POST | /api/auth/register, /login | ทุกคน | สมัคร / เข้าสู่ระบบ (JWT) |
| GET | /api/rooms | ทุกคน | ห้องพัก (กรอง status/type/maxRent) |
| POST | /api/bookings | ทุกคน | จองนัดชม / จองเช่า |
| PATCH | /api/bookings/:id/status | Admin | ยืนยัน/ยกเลิกการจอง |
| GET | /api/bills | Resident/Admin | ค่าน้ำค่าไฟ (อัปเดต OVERDUE อัตโนมัติ) |
| POST | /api/bills | Admin | ออกบิลจากเลขมิเตอร์ (คำนวณยอดอัตโนมัติ) |
| POST | /api/bills/:id/pay | Resident | ชำระเงิน |
| GET | /api/parking/summary | ทุกคน | จำนวนช่องว่าง |
| GET | /api/parking/slots | Resident/Admin | ผังที่จอด |
| POST | /api/parking/entry, /exit | Admin | บันทึกรถเข้า-ออก |
| GET/POST | /api/parcels | Resident/Admin | พัสดุ |
| PATCH | /api/parcels/:id/pickup | Resident/Admin | ยืนยันรับพัสดุ |
| GET | /api/benefits | ทุกคน | สิทธิประโยชน์ |
| POST | /api/benefits/:id/redeem | Resident | รับโค้ดส่วนลด |
| GET | /api/notifications | ผู้ใช้ที่ล็อกอิน | การแจ้งเตือนของฉัน + จำนวนที่ยังไม่อ่าน |
| PATCH | /api/notifications/:id/read, /read-all | ผู้ใช้ที่ล็อกอิน | ทำเครื่องหมายว่าอ่านแล้ว |
| GET | /api/users | Admin | รายชื่อสมาชิก |
| PATCH | /api/users/:id/room | Admin | ผูก/ยกเลิกห้องให้สมาชิก |
| GET | /api/ai/parking | Resident | AI วิเคราะห์ที่จอด + ช่วงเวลาที่รถเยอะ |
| GET | /api/ai/parcels, /bills, /summary | Admin | AI พัสดุตกค้าง / ค่าน้ำไฟผิดปกติ / สรุปรวม |

## การแจ้งเตือน (กระดิ่ง 🔔)
| เหตุการณ์ | ผู้รับ |
|---|---|
| สมัครสมาชิกใหม่ | แอดมินทุกคน |
| มีการจองนัดชม/เช่า | แอดมินทุกคน |
| ผู้พักชำระบิล | แอดมินทุกคน |
| อนุมัติ/ยกเลิกการจอง | ผู้จอง (ถ้าล็อกอินตอนจอง) |
| ผูกห้อง/ยกเลิกห้อง | ผู้ใช้คนนั้น |
| ออกบิลใหม่ | ผู้พักในห้องนั้น |
| พัสดุมาถึง | ผู้รับ |

## ส่วน AI
1. **ที่จอดว่าง** — คำนวณอัตราการใช้งานแยกประเภท (รถยนต์/มอเตอร์ไซค์/EV), พยากรณ์ช่วงเวลาที่รถเข้าเยอะจากประวัติ 14 วัน, ตรวจรถจอดค้างเกิน 48 ชม.
2. **พัสดุตกค้าง** — ให้คะแนนความเสี่ยงตามจำนวนวัน (LOW < 3 วัน, MEDIUM 3–6, HIGH ≥ 7) พร้อมคำแนะนำการจัดการ
3. **ค่าน้ำค่าไฟผิดปกติ** — Anomaly detection ด้วย z-score เทียบประวัติของห้องเอง (z > 2 = ผิดปกติ เช่น ท่อรั่ว)
4. **สรุปภาษาไทย** — ถ้าใส่ `ANTHROPIC_API_KEY` ใน `.env` จะใช้ LLM สรุปผลให้นิติบุคคล ถ้าไม่ใส่จะใช้สรุปแบบ rule-based (ทำงานได้ทันที)
