import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

type Noti = { id: string; title: string; message: string; link: string | null; read: boolean; createdAt: string };

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  if (m < 1440) return `${Math.floor(m / 60)} ชม.ที่แล้ว`;
  return `${Math.floor(m / 1440)} วันที่แล้ว`;
};

/** กระดิ่งแจ้งเตือน: ดึงข้อมูลใหม่ทุก 15 วินาที */
export default function NotificationBell() {
  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  const load = () =>
    api.get<{ items: Noti[]; unread: number }>("/notifications").then((r) => {
      setItems(r.data.items);
      setUnread(r.data.unread);
    }).catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => { clearInterval(t); document.removeEventListener("mousedown", close); };
  }, []);

  const click = async (n: Noti) => {
    if (!n.read) await api.patch(`/notifications/${n.id}/read`);
    setOpen(false);
    load();
    if (n.link) nav(n.link);
  };

  const readAll = async () => {
    await api.patch("/notifications/read-all");
    load();
  };

  return (
    <div className="relative" ref={box}>
      <button className="relative rounded-lg p-2 text-xl hover:bg-haven-50" onClick={() => setOpen(!open)} aria-label="การแจ้งเตือน">
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-xs font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold">การแจ้งเตือน</p>
            {unread > 0 && <button className="text-xs text-haven-700" onClick={readAll}>อ่านทั้งหมด</button>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="p-4 text-sm text-slate-500">ยังไม่มีการแจ้งเตือน</p>}
            {items.map((n) => (
              <button key={n.id} onClick={() => click(n)}
                className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? "" : "bg-haven-50"}`}>
                <p className="text-sm font-semibold">{!n.read && <span className="mr-1 text-haven-600">●</span>}{n.title}</p>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
