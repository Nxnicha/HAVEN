import { useState } from "react";
import { api, errMsg } from "../api/client";
import { useAuth } from "../auth";
import { useFetch } from "../hooks";
import type { Benefit } from "../schemas";

// เลือกไอคอนจากชื่อสิทธิประโยชน์ก่อน แล้วค่อยใช้ตามหมวด
const keywordIcon: [RegExp, string][] = [
  [/ฟิตเนส|ยิม|gym|fitness/i, "🏋️"],
  [/สระ|ว่ายน้ำ|pool/i, "🏊"],
  [/กาแฟ|คาเฟ่|cafe|coffee/i, "☕"],
  [/ซัก|รีด|laundry/i, "👕"],
  [/ชาร์จ|ev/i, "⚡"],
  [/จอด|parking/i, "🅿️"],
];
const categoryIcon: Record<string, string> = { FACILITY: "🏢", PARTNER: "🤝", PARKING: "🅿️" };
const iconFor = (b: Benefit) => keywordIcon.find(([re]) => re.test(b.title))?.[1] ?? categoryIcon[b.category] ?? "🎁";

export default function Benefits() {
  const { user } = useAuth();
  const { data } = useFetch<Benefit[]>("/benefits");
  const [codes, setCodes] = useState<Record<string, string>>({});

  const redeem = async (id: string) => {
    try {
      const { data } = await api.post(`/benefits/${id}/redeem`);
      setCodes((c) => ({ ...c, [id]: data.code }));
    } catch (e) {
      setCodes((c) => ({ ...c, [id]: errMsg(e) }));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">สิทธิประโยชน์ผู้พักอาศัย</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((b) => (
          <div key={b.id} className="card flex flex-col">
            <div className="text-3xl">{iconFor(b)}</div>
            <h3 className="mt-2 font-semibold">{b.title}</h3>
            <p className="flex-1 text-sm text-slate-500">{b.description}</p>
            {b.discount && <p className="mt-2 text-lg font-bold text-haven-700">{b.discount}</p>}
            {b.partner && <p className="text-xs text-slate-400">โดย {b.partner}</p>}
            {user?.roomId && b.category !== "FACILITY" && (
              codes[b.id]
                ? <p className="mt-3 rounded-lg bg-haven-50 p-2 text-center font-mono text-haven-700">{codes[b.id]}</p>
                : <button className="btn mt-3" onClick={() => redeem(b.id)}>รับโค้ด</button>
            )}
          </div>
        ))}
      </div>
      {!user && <p className="text-sm text-slate-500">เข้าสู่ระบบในฐานะผู้พักอาศัยเพื่อรับโค้ดส่วนลด</p>}
    </div>
  );
}
