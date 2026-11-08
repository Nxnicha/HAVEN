import axios, { AxiosError } from "axios";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api" });

// แนบ JWT ทุก request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("haven_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// token หมดอายุ -> ออกจากระบบ
api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401 && localStorage.getItem("haven_token")) {
      localStorage.removeItem("haven_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const errMsg = (e: unknown) =>
  (e as AxiosError<{ message?: string }>)?.response?.data?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่";
