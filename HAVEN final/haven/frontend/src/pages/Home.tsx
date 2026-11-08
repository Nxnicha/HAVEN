import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useFetch, baht, roomImage } from "../hooks";
import { RoomSchema } from "../schemas";
import { StatusBadge } from "../components/Layout";
import { PHOTOS, useFallback } from "../images";

export default function Home() {
  const [type, setType] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (onlyAvailable) qs.set("status", "AVAILABLE");
  const { data, loading, error } = useFetch<unknown>(`/rooms?${qs}`);
  const parsed = data ? z.array(RoomSchema).safeParse(data) : null;
  const rooms = parsed?.success ? parsed.data : [];

  const { data: parking } = useFetch<{ type: string; status: string; count: number }[]>("/parking/summary");
  const freeCars = parking?.filter((p) => p.type === "CAR" && p.status === "AVAILABLE").reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-8 rounded-3xl bg-gradient-to-br from-haven-700 to-haven-900 px-8 py-10 text-white md:flex-row">
        <div className="flex-1">
        <p className="text-sm uppercase tracking-[0.3em] text-haven-100">Condominium</p>
        <h1 className="mt-2 text-4xl font-bold">HAVEN — บ้านที่ดูแลคุณด้วยระบบอัจฉริยะ</h1>
        <p className="mt-3 max-w-xl text-haven-100">ดูห้องว่าง จองนัดชม ชำระค่าน้ำค่าไฟ ติดตามพัสดุ และเช็กที่จอดรถ ได้ในที่เดียว</p>
        {freeCars !== undefined && <p className="mt-6 inline-block rounded-full bg-white/10 px-4 py-1 text-sm">ที่จอดรถยนต์ว่างขณะนี้: {freeCars} ช่อง</p>}
        </div>
        <img src={PHOTOS.building.src} onError={useFallback(PHOTOS.building.fallback)} alt="อาคาร HAVEN Condominium" className="h-72 w-full max-w-md rounded-2xl object-cover shadow-lg" />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-2xl font-semibold">ห้องพัก</h2>
          <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">ทุกประเภท</option>
            <option>Studio</option>
            <option>1 Bedroom</option>
            <option>2 Bedroom</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> เฉพาะห้องว่าง
          </label>
        </div>
        {loading && <p className="text-slate-500">กำลังโหลด...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <Link key={r.id} to={`/rooms/${r.id}`} className="card transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative mb-3 overflow-hidden rounded-xl">
                <img src={roomImage(r).src} onError={useFallback(roomImage(r).fallback)} alt={`ห้อง ${r.number} ${r.type}`} className="h-44 w-full object-cover" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-sm font-bold text-haven-700">ห้อง {r.number}</span>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{r.type}</h3>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-slate-500">ชั้น {r.floor} · {r.sizeSqm} ตร.ม.</p>
              <p className="mt-2 text-lg font-semibold text-haven-700">{baht(r.monthlyRent)}<span className="text-sm font-normal text-slate-500"> /เดือน</span></p>
            </Link>
          ))}
        </div>
        {!loading && !error && rooms.length === 0 && <p className="text-slate-500">ไม่พบห้องตามเงื่อนไข</p>}
      </section>
    </div>
  );
}
