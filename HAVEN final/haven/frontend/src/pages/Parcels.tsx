import { useState, type FormEvent } from "react";
import { api, errMsg } from "../api/client";
import { useAuth } from "../auth";
import { useFetch, thDate } from "../hooks";
import { ParcelFormSchema, fieldErrors, type Parcel } from "../schemas";
import { StatusBadge } from "../components/Layout";

const daysAgo = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);

export default function Parcels() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data, reload } = useFetch<Parcel[]>("/parcels");
  const [form, setForm] = useState({ trackingNo: "", carrier: "", roomNumber: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = ParcelFormSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    try {
      await api.post("/parcels", parsed.data);
      setForm({ trackingNo: "", carrier: "", roomNumber: "" });
      setMsg("บันทึกพัสดุแล้ว ระบบแจ้งผู้รับเรียบร้อย");
      reload();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };

  const pickup = async (id: string) => {
    await api.patch(`/parcels/${id}/pickup`);
    reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ติดตามพัสดุ</h1>

      {isAdmin && (
        <form onSubmit={add} noValidate className="card grid gap-3 sm:grid-cols-4">
          {([["trackingNo", "เลขพัสดุ"], ["carrier", "ขนส่ง"], ["roomNumber", "ห้อง"]] as const).map(([k, l]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              {errors[k] && <p className="err">{errors[k]}</p>}
            </div>
          ))}
          <button className="btn self-end">+ รับพัสดุเข้า</button>
          {msg && <p className="text-sm text-haven-700 sm:col-span-4">{msg}</p>}
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((p) => {
          const d = daysAgo(p.receivedAt);
          const stale = p.status === "WAITING" && d >= 3;
          return (
            <div key={p.id} className={`card flex items-center gap-4 ${stale ? "ring-2 ring-amber-300" : ""}`}>
              <div className="text-3xl">📦</div>
              <div className="flex-1">
                <p className="font-semibold">{p.carrier} · {p.trackingNo}</p>
                <p className="text-sm text-slate-500">ห้อง {p.room.number} · รับเข้า {thDate(p.receivedAt)}{p.status === "WAITING" && ` (${d} วัน)`}</p>
                {stale && <p className="text-xs text-amber-700">⚠ พัสดุตกค้างเกิน 3 วัน กรุณามารับ</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={p.status} />
                {p.status === "WAITING" && <button className="btn-ghost text-xs" onClick={() => pickup(p.id)}>ยืนยันรับแล้ว</button>}
              </div>
            </div>
          );
        })}
      </div>
      {data?.length === 0 && <p className="text-slate-500">ไม่มีพัสดุ</p>}
    </div>
  );
}
