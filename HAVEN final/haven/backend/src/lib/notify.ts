import { prisma } from "./prisma";

type Msg = { title: string; message: string; link?: string };

/** แจ้งเตือนผู้ใช้คนเดียว */
export const notifyUser = (userId: string, m: Msg) =>
  prisma.notification.create({ data: { userId, ...m } });

/** แจ้งเตือนแอดมิน (นิติบุคคล) ทุกคน */
export async function notifyAdmins(m: Msg) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length) await prisma.notification.createMany({ data: admins.map((a) => ({ userId: a.id, ...m })) });
}

/** แจ้งเตือนผู้พักอาศัยทุกคนในห้อง */
export async function notifyRoom(roomId: string, m: Msg) {
  const users = await prisma.user.findMany({ where: { roomId }, select: { id: true } });
  if (users.length) await prisma.notification.createMany({ data: users.map((u) => ({ userId: u.id, ...m })) });
}
