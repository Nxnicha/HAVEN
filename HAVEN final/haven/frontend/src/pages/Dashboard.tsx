import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { useFetch, baht } from "../hooks";
import type { Bill, Parcel, Slot } from "../schemas";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: bills } = useFetch<Bill[]>("/bills");
  const { data: parcels } = useFetch<Parcel[]>("/parcels");
  const { data: slots } = useFetch<Slot[]>("/parking/slots");

  const unpaid = bills?.filter((b) => b.status !== "PAID") ?? [];
  const waiting = parcels?.filter((p) => p.status === "WAITING") ?? [];
  const mySlot = slots?.find((s) => s.mine);
  const free = slots?.filter((s) => s.status === "AVAILABLE").length ?? 0;

  const cards = [
    { to: "/bills", title: "ค่าใช้จ่ายค้างชำระ", value: baht(unpaid.reduce((a, b) => a + b.total, 0)), sub: `${unpaid.length} บิล`, warn: unpaid.some((b) => b.status === "OVERDUE") },
    { to: "/parcels", title: "พัสดุรอรับ", value: `${waiting.length} ชิ้น`, sub: "ที่ห้องนิติบุคคลชั้น 1", warn: waiting.length > 0 },
    { to: "/parking", title: "ที่จอดของฉัน", value: mySlot?.code ?? "-", sub: `ช่องว่างทั้งหมด ${free} ช่อง`, warn: false },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">สวัสดี, {user?.name}</h1>
      {!user?.roomId && user?.role !== "ADMIN" && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">บัญชีนี้ยังไม่ผูกกับห้องพัก — ติดต่อนิติบุคคลเพื่อเชื่อมบัญชีกับห้องของคุณ</p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className={`card hover:shadow-md ${c.warn ? "ring-amber-300" : ""}`}>
            <p className="text-sm text-slate-500">{c.title}</p>
            <p className="mt-1 text-3xl font-bold text-haven-700">{c.value}</p>
            <p className="text-sm text-slate-500">{c.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
