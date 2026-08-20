import React, { useRef, useState } from "react";
import "./AuthPage.css";
import { Boxes } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(emailRef.current.value, passwordRef.current.value);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ---------- panel visual kiri ---------- */}
      <div
        className="auth-visual"
        style={{ "--stripe-a": "#5B4FE9", "--stripe-b": "#FF7A68" }}
      >
        <div className="auth-visual__logo">
          <span className="auth-visual__mark">
            <Boxes size={16} strokeWidth={2.4} />
          </span>
          OPSERA
        </div>
        <div className="auth-stripe auth-stripe--top" />
        <div className="auth-stripe auth-stripe--bottom" />
      </div>

      {/* ---------- form kanan ---------- */}
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="auth-eyebrow">Introduction</span>
          <h2>Selamat Datang Kembali!</h2>
          <p>
            Masuk untuk memantau jadwal, rute pengiriman, dan gudang Anda
            dari satu dashboard real-time.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            ref={emailRef}
            type="email"
            placeholder="Masukkan alamat email Anda"
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            ref={passwordRef}
            type="password"
            placeholder="Masukkan password Anda"
            autoComplete="current-password"
            required
          />

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Memproses..." : "Masuk Sekarang"}
          </button>

          <a href="#" className="auth-link">
            Lupa Password?
          </a>

          <div className="auth-divider">
            <span>atau</span>
          </div>

          <button type="button" className="auth-btn-google">
            <span className="auth-g-mark">G</span>
            Lanjutkan dengan Google
          </button>

          <p className="auth-switch">
            Belum punya akun?{" "}
            <Link to="/signup">Daftar di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
}