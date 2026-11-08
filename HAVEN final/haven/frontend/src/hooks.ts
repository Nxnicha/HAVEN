import { useCallback, useEffect, useState } from "react";
import { api, errMsg } from "./api/client";

/** ดึงข้อมูลจาก API ด้วย Axios พร้อมสถานะ loading/error */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!url) return;
    setLoading(true);
    api
      .get<T>(url)
      .then((r) => {
        setData(r.data);
        setError(null);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(reload, [reload]);
  return { data, loading, error, reload };
}

import { PHOTOS } from "./images";

/** รูปห้อง: ใช้ imageUrl ถ้ามี ไม่งั้นใช้รูปถ่ายตามประเภทห้อง (+ รูปสำรอง) */
export const roomImage = (r: { type: string; imageUrl: string | null }) => {
  const key = r.type.toLowerCase().replace(/\s+/g, "-");
  const fallback = `/images/${key}.svg`;
  return { src: r.imageUrl || PHOTOS.rooms[key]?.src || fallback, fallback };
};

export const baht = (n: number) => n.toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
export const thDate = (d: string | Date) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
