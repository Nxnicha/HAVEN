import type { SyntheticEvent } from "react";

/**
 * รูปถ่ายจริงจาก Unsplash (ใช้ฟรีภายใต้ Unsplash License — https://unsplash.com/license)
 * ถ้าโหลดรูปไม่ได้ (เช่น ไม่มีอินเทอร์เน็ต) จะใช้รูปสำรองใน public/images แทนอัตโนมัติ
 *
 * เครดิต:
 *  - ตึก:        Ricardo Gomez Angel  https://unsplash.com/photos/iYQT6PNToYo
 *  - Studio:     kate.sade            https://unsplash.com/photos/s2ck86r3GGc
 *  - 1 Bedroom:  Caroline Badran      https://unsplash.com/photos/12WFO8yWrsw
 *  - 2 Bedroom:  David Kristianto     https://unsplash.com/photos/clRNC8Fm7j8
 *  - ห้องนอน:    CHUTTERSNAP          https://unsplash.com/photos/JUO3MGEHTrQ
 */
const u = (id: string, w = 1200) => `https://images.unsplash.com/${id}?w=${w}&q=75&auto=format&fit=crop`;

export const PHOTOS = {
  building: { src: u("photo-1525953776754-6c4b7ee655ab", 1000), fallback: "/images/building.svg" },
  rooms: {
    studio: { src: u("photo-1644319254804-5daea68c6845"), fallback: "/images/studio.svg" },
    "1-bedroom": { src: u("photo-1758565811176-ccd94357a844"), fallback: "/images/1-bedroom.svg" },
    "2-bedroom": { src: u("photo-1741682739917-dae3dd66364f"), fallback: "/images/2-bedroom.svg" },
  } as Record<string, { src: string; fallback: string }>,
  bedroom: u("photo-1530334565651-210b286480b7"),
};

/** onError ของ <img>: สลับไปใช้รูปสำรองครั้งเดียว */
export const useFallback = (fallback: string) => (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (!img.src.endsWith(fallback)) img.src = fallback;
};
