import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api, errMsg } from "../api/client";
import { useFetch, baht, roomImage } from "../hooks";
import { BookingFormSchema, fieldErrors, type Room } from "../schemas";
import { StatusBadge } from "../components/Layout";
import { useAuth } from "../auth";
import { PHOTOS, useFallback } from "../images";

export default function RoomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: room, loading } = useFetch<Room>(`/rooms/${id}`);
  const [form, setForm] = useState({
    guestName: user?.name ?? "", guestEmail: user?.email ?? "", guestPhone: user?.phone ?? "",
    type: "VIEWING", startDate: "", months: "", note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = BookingFormSchema.safeParse({ ...form, months: form.months || undefined, note: form.note || undefined });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    try {
      await api.post("/bookings", { ...parsed.data, roomId: id, startDate: new Date(parsed.data.startDate).toISOString() });
      setMsg({ ok: true, text: "ส่งคำขอเรียบร้อย เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชม." });
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err) });
    }
  };

  if (loading) return <p>กำลังโหลด...</p>;
  if (!room) return <p>ไม่พบห้อง</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <img src={roomImage(room).src} onError={useFallback(roomImage(room).fallback)} alt={`ห้อง ${room.number} ${room.type}`} className="mb-3 h-72 w-full rounded-xl object-cover" />
        {room.type !== "Studio" && (
          <img src={PHOTOS.bedroom} onError={(e) => (e.currentTarget.style.display = "none")} alt="ห้องนอน" className="mb-4 h-40 w-full rounded-xl object-cover" loading="lazy" />
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">ห้อง {room.number} · {room.type}</h1>
          <StatusBadge status={room.status} />
        </div>
        <p className="mt-2 text-slate-600">{room.description}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">ชั้น</dt><dd className="font-semibold">{room.floor}</dd></div>
          <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">ขนาด</dt><dd className="font-semibold">{room.sizeSqm} ตร.ม.</dd></div>
          <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">ค่าเช่า</dt><dd className="font-semibold">{baht(room.monthlyRent)}</dd></div>
        </dl>
      </div>

      <form onSubmit={submit} className="card space-y-4" noValidate>
        <h2 className="text-xl font-semibold">จองนัดชม / จองเช่า</h2>
        <div className="flex gap-2">
          {(["VIEWING", "RENT"] as const).map((t) => (
            <button type="button" key={t} onClick={() => setForm({ ...form, type: t })}
              disabled={t === "RENT" && room.status !== "AVAILABLE"}
              className={form.type === t ? "btn" : "btn-ghost"}>
              {t === "VIEWING" ? "นัดชมห้อง" : "จองเช่า"}
            </button>
          ))}
        </div>
        {[
          ["guestName", "ชื่อ-นามสกุล", "text"],
          ["guestEmail", "อีเมล", "email"],
          ["guestPhone", "เบอร์โทร", "tel"],
          ["startDate", form.type === "RENT" ? "วันที่เริ่มเช่า" : "วันที่นัดชม", "date"],
        ].map(([k, label, type]) => (
          <div key={k}>
            <label className="label">{label}</label>
            <input className="input" type={type} value={form[k as keyof typeof form]} onChange={set(k as keyof typeof form)} />
            {errors[k] && <p className="err">{errors[k]}</p>}
          </div>
        ))}
        {form.type === "RENT" && (
          <div>
            <label className="label">ระยะเวลาเช่า (เดือน)</label>
            <input className="input" type="number" min={1} max={36} value={form.months} onChange={set("months")} />
            {errors.months && <p className="err">{errors.months}</p>}
          </div>
        )}
        <div>
          <label className="label">หมายเหตุ</label>
          <textarea className="input" rows={2} value={form.note} onChange={set("note")} />
        </div>
        <button className="btn w-full">ส่งคำขอ</button>
        {msg && <p className={msg.ok ? "text-emerald-700" : "text-red-600"}>{msg.text}</p>}
      </form>
    </div>
  );
}
