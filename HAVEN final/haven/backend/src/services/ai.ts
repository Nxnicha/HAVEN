/**
 * HAVEN AI Service
 * ชั้นที่ 1: วิเคราะห์ด้วยสถิติ/กฎ (ทำงานได้เสมอ ไม่ต้องใช้อินเทอร์เน็ต)
 * ชั้นที่ 2: (ถ้ามี ANTHROPIC_API_KEY) ส่งผลวิเคราะห์ให้ LLM สรุปเป็นภาษาไทยให้นิติบุคคลอ่านง่าย
 */
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";

const DAY = 86_400_000;
const HOUR = 3_600_000;

// ---------------- ที่จอดรถ ----------------
export async function analyzeParking() {
  const slots = await prisma.parkingSlot.findMany({ include: { logs: { where: { exitAt: null } } } });
  const since = new Date(Date.now() - 14 * DAY);
  const logs = await prisma.parkingLog.findMany({ where: { entryAt: { gte: since } } });

  const byType: Record<string, { total: number; available: number }> = {};
  for (const s of slots) {
    byType[s.type] ??= { total: 0, available: 0 };
    byType[s.type].total++;
    if (s.status === "AVAILABLE") byType[s.type].available++;
  }
  const occupancy = Object.entries(byType).map(([type, v]) => ({
    type,
    ...v,
    occupancyRate: v.total ? Math.round(((v.total - v.available) / v.total) * 100) : 0,
  }));

  // พยากรณ์ช่วงเวลาที่รถเข้าเยอะ จากประวัติ 14 วัน
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, avgEntries: 0 }));
  for (const l of logs) hourly[new Date(l.entryAt).getHours()].avgEntries++;
  hourly.forEach((h) => (h.avgEntries = +(h.avgEntries / 14).toFixed(2)));
  const peakHours = [...hourly].sort((a, b) => b.avgEntries - a.avgEntries).slice(0, 3).map((h) => h.hour);

  // รถจอดค้างนานผิดปกติ (> 48 ชม.) หรือจอดในช่องที่ไม่ได้จองไว้ให้
  const now = Date.now();
  const longStay = slots
    .flatMap((s) => s.logs.map((l) => ({ slot: s.code, plate: l.plate, hours: Math.round((now - l.entryAt.getTime()) / HOUR) })))
    .filter((x) => x.hours > 48)
    .sort((a, b) => b.hours - a.hours);

  const alerts: string[] = [];
  for (const o of occupancy) if (o.occupancyRate >= 90) alerts.push(`ที่จอด ${o.type} ใกล้เต็ม (${o.occupancyRate}%)`);
  if (longStay.length) alerts.push(`พบรถจอดค้างเกิน 48 ชม. ${longStay.length} คัน`);

  return { occupancy, peakHours, hourly, longStay, alerts };
}

// ---------------- พัสดุตกค้าง ----------------
export async function analyzeParcels() {
  const waiting = await prisma.parcel.findMany({
    where: { status: "WAITING" },
    include: { room: { select: { number: true } }, recipient: { select: { name: true, phone: true } } },
  });
  const now = Date.now();
  const items = waiting
    .map((p) => {
      const days = Math.floor((now - p.receivedAt.getTime()) / DAY);
      // คะแนนความเสี่ยง: ยิ่งค้างนานยิ่งสูง (0-100)
      const risk = Math.min(100, Math.round((days / 14) * 100));
      const level = days >= 7 ? "HIGH" : days >= 3 ? "MEDIUM" : "LOW";
      return {
        id: p.id, trackingNo: p.trackingNo, carrier: p.carrier, room: p.room.number,
        recipient: p.recipient.name, days, risk, level,
        suggestion:
          level === "HIGH" ? "โทรแจ้งผู้รับ และพิจารณาส่งคืนต้นทางหากเกิน 14 วัน"
          : level === "MEDIUM" ? "ส่งการแจ้งเตือนซ้ำให้ผู้รับ"
          : "รอผู้รับมารับตามปกติ",
      };
    })
    .sort((a, b) => b.days - a.days);

  const overdue = items.filter((i) => i.level !== "LOW");
  return {
    totalWaiting: items.length,
    overdueCount: overdue.length,
    items,
    alerts: overdue.length ? [`มีพัสดุตกค้างเกิน 3 วัน ${overdue.length} ชิ้น`] : [],
  };
}

// ---------------- ค่าน้ำค่าไฟผิดปกติ ----------------
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const std = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

export async function analyzeBills() {
  const bills = await prisma.utilityBill.findMany({ include: { room: { select: { number: true } } }, orderBy: { month: "asc" } });
  const byRoom = new Map<string, typeof bills>();
  for (const b of bills) byRoom.set(b.room.number, [...(byRoom.get(b.room.number) ?? []), b]);

  const anomalies: { room: string; month: string; kind: "WATER" | "ELECTRIC"; usage: number; avg: number; zScore: number; note: string }[] = [];
  for (const [room, list] of byRoom) {
    if (list.length < 3) continue;
    const latest = list[list.length - 1];
    const hist = list.slice(0, -1);
    for (const kind of ["WATER", "ELECTRIC"] as const) {
      const use = (b: (typeof list)[number]) => (kind === "WATER" ? b.waterCurr - b.waterPrev : b.elecCurr - b.elecPrev);
      const series = hist.map(use);
      const m = mean(series);
      const s = std(series) || 1;
      const z = (use(latest) - m) / s;
      if (z > 2)
        anomalies.push({
          room, month: latest.month, kind, usage: use(latest), avg: +m.toFixed(1), zScore: +z.toFixed(2),
          note: kind === "WATER" ? "การใช้น้ำสูงผิดปกติ อาจมีท่อรั่ว/ชักโครกรั่ว" : "การใช้ไฟสูงผิดปกติ ตรวจสอบเครื่องใช้ไฟฟ้า/แอร์",
        });
    }
  }

  const unpaid = bills.filter((b) => b.status !== "PAID");
  return {
    anomalies,
    unpaidCount: unpaid.length,
    unpaidAmount: unpaid.reduce((a, b) => a + b.total, 0),
    alerts: anomalies.map((a) => `ห้อง ${a.room}: ${a.note} (z=${a.zScore})`),
  };
}

// ---------------- สรุปรวมด้วย LLM (ไม่บังคับ) ----------------
export async function aiSummary() {
  const [parking, parcels, bills] = await Promise.all([analyzeParking(), analyzeParcels(), analyzeBills()]);
  const alerts = [...parking.alerts, ...parcels.alerts, ...bills.alerts];
  let summary = alerts.length ? `พบประเด็นที่ควรดำเนินการ ${alerts.length} เรื่อง: ${alerts.join(" / ")}` : "ทุกระบบปกติ ไม่พบความผิดปกติ";
  let source: "rule-based" | "llm" = "rule-based";

  if (env.ANTHROPIC_API_KEY) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content:
                "คุณคือผู้ช่วยนิติบุคคลคอนโด สรุปข้อมูลต่อไปนี้เป็นภาษาไทยไม่เกิน 5 บรรทัด พร้อมสิ่งที่ควรทำก่อน:\n" +
                JSON.stringify({ parking: { occupancy: parking.occupancy, peakHours: parking.peakHours, longStay: parking.longStay.length }, parcels: { waiting: parcels.totalWaiting, overdue: parcels.overdueCount }, bills: { anomalies: bills.anomalies, unpaid: bills.unpaidCount } }),
            },
          ],
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { content: { type: string; text?: string }[] };
        summary = data.content.map((c) => c.text ?? "").join("").trim() || summary;
        source = "llm";
      }
    } catch {
      /* fallback เป็น rule-based */
    }
  }
  return { summary, source, alerts, parking, parcels, bills };
}
