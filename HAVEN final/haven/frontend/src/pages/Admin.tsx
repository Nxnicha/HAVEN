import { useFetch, baht } from "../hooks";

type Summary = {
  summary: string;
  source: "rule-based" | "llm";
  alerts: string[];
  parking: { occupancy: { type: string; total: number; available: number; occupancyRate: number }[]; peakHours: number[]; hourly: { hour: number; avgEntries: number }[]; longStay: { slot: string; plate: string; hours: number }[] };
  parcels: { totalWaiting: number; overdueCount: number; items: { id: string; trackingNo: string; room: string; recipient: string; days: number; level: string; suggestion: string }[] };
  bills: { anomalies: { room: string; month: string; kind: string; usage: number; avg: number; zScore: number; note: string }[]; unpaidCount: number; unpaidAmount: number };
};

const levelCls: Record<string, string> = { HIGH: "bg-red-100 text-red-700", MEDIUM: "bg-amber-100 text-amber-700", LOW: "bg-slate-100 text-slate-600" };

export default function Admin() {
  const { data, loading, reload } = useFetch<Summary>("/ai/summary");
  if (loading || !data) return <p>AI กำลังวิเคราะห์ข้อมูล...</p>;
  const maxH = Math.max(...data.parking.hourly.map((h) => h.avgEntries), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="mr-auto text-2xl font-semibold">AI ตรวจสอบข้อมูลคอนโด</h1>
        <button className="btn-ghost" onClick={reload}>วิเคราะห์ใหม่</button>
      </div>

      <div className="card bg-haven-900 text-white">
        <p className="text-xs uppercase tracking-widest text-haven-100">สรุปโดย AI ({data.source === "llm" ? "LLM" : "Rule-based"})</p>
        <p className="mt-2 whitespace-pre-line">{data.summary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {data.parking.occupancy.map((o) => (
          <div key={o.type} className="card"><p className="text-sm text-slate-500">ที่จอด {o.type} ว่าง</p><p className="text-3xl font-bold text-haven-700">{o.available}/{o.total}</p></div>
        ))}
        <div className="card"><p className="text-sm text-slate-500">พัสดุตกค้าง &gt;3 วัน</p><p className="text-3xl font-bold text-amber-600">{data.parcels.overdueCount}</p></div>
      </div>

      <section className="card">
        <h2 className="font-semibold">การพยากรณ์รถเข้า-ออกรายชั่วโมง (เฉลี่ย 14 วัน)</h2>
        <div className="mt-4 flex h-32 items-end gap-1">
          {data.parking.hourly.map((h) => (
            <div key={h.hour} className="flex flex-1 flex-col items-center">
              <div className={`w-full rounded-t ${data.parking.peakHours.includes(h.hour) ? "bg-amber-500" : "bg-haven-500"}`} style={{ height: `${(h.avgEntries / maxH) * 100}%` }} title={`${h.avgEntries} คัน`} />
              <span className="mt-1 text-[10px] text-slate-400">{h.hour}</span>
            </div>
          ))}
        </div>
        {data.parking.longStay.length > 0 && (
          <p className="mt-3 text-sm text-red-600">รถจอดค้างเกิน 48 ชม.: {data.parking.longStay.map((l) => `${l.plate} (${l.slot}, ${l.hours} ชม.)`).join(", ")}</p>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">พัสดุตกค้าง (จัดลำดับความเสี่ยง)</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500"><tr><th className="py-2">เลขพัสดุ</th><th>ห้อง</th><th>ค้าง</th><th>ระดับ</th><th>คำแนะนำ AI</th></tr></thead>
          <tbody>
            {data.parcels.items.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-2">{p.trackingNo}</td><td>{p.room}</td><td>{p.days} วัน</td>
                <td><span className={`badge ${levelCls[p.level]}`}>{p.level}</span></td><td className="text-slate-600">{p.suggestion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-1 font-semibold">ค่าน้ำ-ไฟผิดปกติ (Anomaly Detection, z-score &gt; 2)</h2>
        <p className="mb-3 text-sm text-slate-500">ค้างชำระ {data.bills.unpaidCount} บิล รวม {baht(data.bills.unpaidAmount)}</p>
        {data.bills.anomalies.length === 0 ? <p className="text-sm text-slate-500">ไม่พบความผิดปกติ</p> : (
          <ul className="space-y-2">
            {data.bills.anomalies.map((a) => (
              <li key={a.room + a.kind} className="rounded-lg bg-red-50 p-3 text-sm">
                <b>ห้อง {a.room}</b> ({a.month}) — {a.kind === "WATER" ? "น้ำ" : "ไฟ"} {a.usage} หน่วย (เฉลี่ย {a.avg}) z = {a.zScore}<br />
                <span className="text-red-700">{a.note}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
