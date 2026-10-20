import { createContext, useContext, useState } from "react";
import api from "./api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  function save(d) {
    localStorage.setItem("token", d.token);
    const u = { name: d.name, email: d.email };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }

  const login = async (email, password) =>
    save((await api.post("/auth/login", { email, password })).data);
  const register = async (name, email, password) =>
    save((await api.post("/auth/register", { name, email, password })).data);
  const logout = () => { localStorage.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}