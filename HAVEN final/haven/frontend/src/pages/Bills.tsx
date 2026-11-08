import { useState } from "react";
import { api, errMsg } from "../api/client";
import { useFetch, baht, thDate } from "../hooks";
import type { Bill } from "../schemas";
import { StatusBadge } from "../components/Layout";

export default function Bills() {
  const { data, loading, reload } = useFetch<Bill[]>("/bills");
  const [paying, setPaying] = useState<Bill | null>(null);
  const [method, setMethod] = useState("PROMPTPAY");
  const [msg, setMsg] = useState("");

  const pay = async () => {
    if (!paying) return;
    try {
      await api.post(`/bills/${paying.id}/pay`, { method });
      setMsg(`ชำระบิลเดือน ${paying.month} สำเร็จ`);
      setPaying(null);
      reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">ค่าน้ำ-ค่าไฟ และค่าส่วนกลาง</h1>
      {msg && <p className="rounded-lg bg-haven-50 p-3 text-sm text-haven-700">{msg}</p>}
      {loading && <p>กำลังโหลด...</p>}
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">เดือน</th><th className="p-3">ห้อง</th><th className="p-3">น้ำ (หน่วย)</th>
              <th className="p-3">ไฟ (หน่วย)</th><th className="p-3">ส่วนกลาง</th><th className="p-3">รวม</th>
              <th className="p-3">ครบกำหนด</th><th className="p-3">สถานะ</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="p-3 font-medium">{b.month}</td>
                <td className="p-3">{b.room.number}</td>
                <td className="p-3">{b.waterCurr - b.waterPrev} <span className="text-slate-400">({baht(b.waterAmount)})</span></td>
                <td className="p-3">{b.elecCurr - b.elecPrev} <span className="text-slate-400">({baht(b.elecAmount)})</span></td>
                <td className="p-3">{baht(b.commonFee)}</td>
                <td className="p-3 font-semibold">{baht(b.total)}</td>
                <td className="p-3">{thDate(b.dueDate)}</td>
                <td className="p-3"><StatusBadge status={b.status} /></td>
                <td className="p-3">{b.status !== "PAID" && <button className="btn" onClick={() => setPaying(b)}>ชำระ</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paying && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold">ชำระบิลเดือน {paying.month}</h2>
            <p className="text-3xl font-bold text-haven-700">{baht(paying.total)}</p>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="PROMPTPAY">พร้อมเพย์ (QR)</option>
              <option value="CARD">บัตรเครดิต/เดบิต</option>
              <option value="CASH">เงินสด ที่นิติบุคคล</option>
            </select>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setPaying(null)}>ยกเลิก</button>
              <button className="btn flex-1" onClick={pay}>ยืนยันชำระ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
