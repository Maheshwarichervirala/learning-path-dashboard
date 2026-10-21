import { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  function save(d) {
    if (d.token) {
      localStorage.setItem("token", d.token);
    }
    const u = { name: d.name, email: d.email, role: d.role || "USER", id: d.id };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }

  // Refresh user data (including role changes) on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api
        .get("/auth/me")
        .then((res) => {
          if (res.data) {
            const u = {
              id: res.data.id,
              name: res.data.name,
              email: res.data.email,
              role: res.data.role || "USER",
            };
            localStorage.setItem("user", JSON.stringify(u));
            setUser(u);
          }
        })
        .catch(() => {
          // Token might be invalid or expired
        });
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    save(res.data);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    save(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <Ctx.Provider value={{ user, login, register, logout, isAdmin }}>
      {children}
    </Ctx.Provider>
  );
}