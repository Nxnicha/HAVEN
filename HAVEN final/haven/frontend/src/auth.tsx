import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { api } from "./api/client";
import { UserSchema, type User } from "./schemas";

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};
const AuthCtx = createContext<Ctx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("haven_token"));

  useEffect(() => {
    if (!localStorage.getItem("haven_token")) return;
    api
      .get("/auth/me")
      .then((r) => setUser(UserSchema.parse(r.data)))
      .catch(() => localStorage.removeItem("haven_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, u: User) => {
    localStorage.setItem("haven_token", token);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("haven_token");
    setUser(null);
  };
  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-slate-500">กำลังโหลด...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
