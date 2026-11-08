import { api, errMsg } from "../api/client";
import { useAuth } from "../auth";
import { useFetch, thDate } from "../hooks";
import { useState } from "react";

type Booking = {
  id: string; guestName: string; guestEmail: string; guestPhone: string; type: "VIEWING" | "RENT";
  startDate: string; months: number | null; status: "PENDING" | "CONFIRMED" | "CANCELLED"; note: string | null;
  createdAt: string; room: { number: string };
};

const statusCls = { PENDING: "bg-amber-100 text-amber-700", CONFIRMED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-slate-200 text-slate-600" };
const statusLabel = { PENDING: "รออนุมัติ", CONFIRMED: "อนุมัติแล้ว", CANCELLED: "ยกเลิก" };

/** แอดมิน: จัดการการจองทั้งหมด · ผู้พัก: การจองของฉัน */
export default function Bookings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data, reload } = useFetch<Booking[]>("/bookings");
  const [msg, setMsg] = useState("");

  const setStatus = async (b: Booking, status: "CONFIRMED" | "CANCELLED") => {
    try {
      await api.patch(`/bookings/${b.id}/status`, { status });
      setMsg(`${status === "CONFIRMED" ? "อนุมัติ" : "ยกเลิก"}การจองห้อง ${b.room.number} ของ ${b.guestName} แล้ว`);
      reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{isAdmin ? "จัดการการจอง" : "การจองของฉัน"}</h1>
      {msg && <p className="rounded-lg bg-haven-50 p-3 text-sm text-haven-700">{msg}</p>}
      {data?.length === 0 && <p className="text-slate-500">ยังไม่มีการจอง</p>}
      <div className="grid gap-3">
        {data?.map((b) => (
          <div key={b.id} className="card flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-haven-50 font-bold text-haven-700">{b.room.number}</div>
            <div className="min-w-60 flex-1">
              <p className="font-semibold">
                {b.type === "RENT" ? `จองเช่า ${b.months} เดือน` : "นัดชมห้อง"} · {thDate(b.startDate)}
              </p>
              <p className="text-sm text-slate-500">{b.guestName} · {b.guestPhone} · {b.guestEmail}</p>
              {b.note && <p className="text-sm text-slate-500">หมายเหตุ: {b.note}</p>}
            </div>
            <span className={`badge ${statusCls[b.status]}`}>{statusLabel[b.status]}</span>
            {isAdmin && b.status === "PENDING" && (
              <div className="flex gap-2">
                <button className="btn" onClick={() => setStatus(b, "CONFIRMED")}>อนุมัติ</button>
                <button className="btn-ghost" onClick={() => setStatus(b, "CANCELLED")}>ยกเลิก</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
