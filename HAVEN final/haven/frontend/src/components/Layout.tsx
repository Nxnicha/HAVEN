import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import NotificationBell from "./NotificationBell";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm ${isActive ? "bg-haven-100 text-haven-700 font-medium" : "text-slate-600 hover:text-haven-700"}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-4 text-xl font-bold tracking-wide text-haven-700">HAVEN</Link>
          <NavLink to="/" end className={linkCls}>ห้องว่าง</NavLink>
          <NavLink to="/benefits" className={linkCls}>สิทธิประโยชน์</NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={linkCls}>หน้าหลัก</NavLink>
              <NavLink to="/bills" className={linkCls}>ค่าน้ำ-ไฟ</NavLink>
              <NavLink to="/parking" className={linkCls}>ที่จอดรถ</NavLink>
              <NavLink to="/parcels" className={linkCls}>พัสดุ</NavLink>
              <NavLink to="/bookings" className={linkCls}>{user.role === "ADMIN" ? "การจอง" : "การจองของฉัน"}</NavLink>
            </>
          )}
          {user?.role === "ADMIN" && (
            <>
              <NavLink to="/admin/members" className={linkCls}>สมาชิก</NavLink>
              <NavLink to="/admin" end className={linkCls}>AI นิติบุคคล</NavLink>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
                <button className="btn-ghost" onClick={() => { logout(); nav("/"); }}>ออกจากระบบ</button>
              </>
            ) : (
              <Link to="/login" className="btn">เข้าสู่ระบบ</Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="py-8 text-center text-xs text-slate-400">© 2026 HAVEN Condominium</footer>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    AVAILABLE: ["ว่าง", "bg-emerald-100 text-emerald-700"],
    OCCUPIED: ["ไม่ว่าง", "bg-slate-200 text-slate-600"],
    MAINTENANCE: ["ปรับปรุง", "bg-amber-100 text-amber-700"],
    RESERVED: ["จองแล้ว", "bg-sky-100 text-sky-700"],
    PAID: ["ชำระแล้ว", "bg-emerald-100 text-emerald-700"],
    UNPAID: ["รอชำระ", "bg-amber-100 text-amber-700"],
    OVERDUE: ["เกินกำหนด", "bg-red-100 text-red-700"],
    WAITING: ["รอรับ", "bg-amber-100 text-amber-700"],
    PICKED_UP: ["รับแล้ว", "bg-emerald-100 text-emerald-700"],
  };
  const [label, cls] = map[status] ?? [status, "bg-slate-100"];
  return <span className={`badge ${cls}`}>{label}</span>;
}
