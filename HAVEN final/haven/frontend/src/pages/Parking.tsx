import { useFetch } from "../hooks";
import type { Slot } from "../schemas";

type ParkingAI = { peakHours: number[]; occupancy: { type: string; total: number; available: number; occupancyRate: number }[]; alerts: string[] };

const color = (s: Slot) =>
  s.mine ? "bg-haven-600 text-white" :
  s.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" :
  s.status === "RESERVED" ? "bg-sky-100 text-sky-800" : "bg-slate-300 text-slate-600";

export default function Parking() {
  const { data: slots, loading } = useFetch<Slot[]>("/parking/slots");
  const { data: ai } = useFetch<ParkingAI>("/ai/parking");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ที่จอดรถ ชั้น B1</h1>

      {ai && (
        <div className="card border-l-4 border-haven-500">
          <p className="text-sm font-semibold text-haven-700">🤖 AI วิเคราะห์ที่จอด</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {ai.occupancy.map((o) => (
              <span key={o.type}>{o.type}: ว่าง <b>{o.available}</b>/{o.total} (ใช้งาน {o.occupancyRate}%)</span>
            ))}
          </div>
          <p className="mt-1 text-sm text-slate-600">ช่วงเวลาที่รถเข้าเยอะ (คาดการณ์): {ai.peakHours.map((h) => `${h}:00`).join(", ")} น. — แนะนำเลี่ยงช่วงนี้</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="badge bg-emerald-100 text-emerald-800">ว่าง</span>
        <span className="badge bg-sky-100 text-sky-800">จองประจำ</span>
        <span className="badge bg-slate-300 text-slate-600">มีรถจอด</span>
        <span className="badge bg-haven-600 text-white">ช่องของฉัน</span>
      </div>

      {loading && <p>กำลังโหลด...</p>}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
        {slots?.map((s) => (
          <div key={s.id} className={`rounded-lg p-2 text-center text-xs font-medium ${color(s)}`} title={s.assignedUser?.name ?? ""}>
            {s.code.replace("B1-", "")}
            <div className="text-[10px] opacity-70">{s.type === "CAR" ? "🚗" : s.type === "EV" ? "⚡" : "🛵"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
