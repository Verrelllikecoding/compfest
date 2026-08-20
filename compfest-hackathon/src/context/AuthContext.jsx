import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Saat app pertama kali dibuka (atau di-refresh), coba pulihkan sesi
    // lewat refresh token yang tersimpan di httpOnly cookie (kalau ada & masih valid).
    authApi
      .refresh()
      .then(async (res) => {
        setAccessToken(res.data.accessToken);
        const me = await authApi.me(res.data.accessToken);
        setUser(me.data);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await authApi.login({ email, password });
    setAccessToken(res.data.accessToken);
    const me = await authApi.me(res.data.accessToken);
    setUser(me.data);
    return res;
  }

  async function register(payload) {
    const res = await authApi.register(payload);
    setAccessToken(res.data.accessToken);
    const me = await authApi.me(res.data.accessToken);
    setUser(me.data);
    return res;
  }

  async function logout() {
    try {
      await authApi.logout(accessToken);
    } catch {
      // walau request logout ke server gagal, tetap bersihkan sesi di sisi client
    }
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ accessToken, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}