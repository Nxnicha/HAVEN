import { useState } from "react";
import { api, errMsg } from "../api/client";
import { useFetch, thDate } from "../hooks";
import type { Room } from "../schemas";

type Member = {
  id: string; email: string; name: string; phone: string | null; role: "RESIDENT" | "ADMIN";
  createdAt: string; room: { id: string; number: string } | null;
};

export default function Members() {
  const { data: users, reload } = useFetch<Member[]>("/users");
  const { data: rooms } = useFetch<Room[]>("/rooms");
  const [pick, setPick] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const assign = async (u: Member, roomId: string | null) => {
    try {
      await api.patch(`/users/${u.id}/room`, { roomId });
      setMsg(roomId ? `ผูกห้องให้ ${u.name} แล้ว ระบบแจ้งเตือนผู้ใช้เรียบร้อย` : `ยกเลิกการผูกห้องของ ${u.name} แล้ว`);
      reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  const residents = users?.filter((u) => u.role === "RESIDENT") ?? [];
  const waiting = residents.filter((u) => !u.room);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">จัดการสมาชิก</h1>
        <p className="text-sm text-slate-500">สมาชิกทั้งหมด {residents.length} คน · รอผูกห้อง {waiting.length} คน</p>
      </div>
      {msg && <p className="rounded-lg bg-haven-50 p-3 text-sm text-haven-700">{msg}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr><th className="p-3">ชื่อ</th><th className="p-3">อีเมล / โทร</th><th className="p-3">สมัครเมื่อ</th><th className="p-3">ห้อง</th><th className="p-3">ผูกห้อง</th></tr>
          </thead>
          <tbody>
            {residents.map((u) => (
              <tr key={u.id} className={`border-t border-slate-100 ${u.room ? "" : "bg-amber-50"}`}>
                <td className="p-3 font-medium">{u.name}{!u.room && <span className="badge ml-2 bg-amber-100 text-amber-700">ใหม่</span>}</td>
                <td className="p-3 text-slate-600">{u.email}<br />{u.phone ?? "-"}</td>
                <td className="p-3">{thDate(u.createdAt)}</td>
                <td className="p-3 font-semibold">{u.room?.number ?? "-"}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <select className="input w-36" value={pick[u.id] ?? ""} onChange={(e) => setPick({ ...pick, [u.id]: e.target.value })}>
                      <option value="">เลือกห้อง</option>
                      {rooms?.map((r) => (
                        <option key={r.id} value={r.id}>{r.number} · {r.status === "AVAILABLE" ? "ว่าง" : r.status === "OCCUPIED" ? "มีผู้พัก" : "ปรับปรุง"}</option>
                      ))}
                    </select>
                    <button className="btn" disabled={!pick[u.id]} onClick={() => assign(u, pick[u.id])}>ผูก</button>
                    {u.room && <button className="btn-ghost" onClick={() => assign(u, null)}>ยกเลิก</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
