import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, errMsg } from "../api/client";
import { useAuth } from "../auth";
import { LoginSchema, RegisterSchema, UserSchema, fieldErrors } from "../schemas";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const schema = mode === "login" ? LoginSchema : RegisterSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    try {
      const { data } = await api.post(`/auth/${mode}`, parsed.data);
      login(data.token, UserSchema.parse(data.user));
      nav(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const field = (k: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      {errors[k] && <p className="err">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="card mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">{mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</h1>
      {mode === "register" && field("name", "ชื่อ-นามสกุล")}
      {field("email", "อีเมล", "email")}
      {field("password", "รหัสผ่าน", "password")}
      {mode === "register" && field("phone", "เบอร์โทร (ไม่บังคับ)", "tel")}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full">{mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</button>
      <button type="button" className="w-full text-sm text-haven-700" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
      </button>
      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        บัญชีทดสอบ: resident@haven.com / admin@haven.com — รหัส password123
      </p>
    </form>
  );
}
