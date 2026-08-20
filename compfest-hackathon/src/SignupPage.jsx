import React, { useRef, useState } from "react";
import "./AuthPage.css";
import { Boxes } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        name: nameRef.current.value,
        email: emailRef.current.value,
        password: passwordRef.current.value,
        // role default "dispatcher" di backend kalau tidak dikirim.
        // Nanti kalau perlu, tambahkan dropdown pilih role di sini.
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registrasi gagal, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ---------- panel visual kiri ---------- */}
      <div
        className="auth-visual"
        style={{ "--stripe-a": "#FFB648", "--stripe-b": "#2FD4C4" }}
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
          <h2>Buat Akun Baru!</h2>
          <p>
            Daftar untuk mulai mengorkestrasi jadwal, rute pengiriman, dan
            gudang Anda dalam satu workspace.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <label htmlFor="signup-name">Nama Lengkap</label>
          <input
            id="signup-name"
            ref={nameRef}
            type="text"
            placeholder="Masukkan nama lengkap Anda"
            autoComplete="name"
            required
            minLength={2}
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            ref={emailRef}
            type="email"
            placeholder="Masukkan alamat email Anda"
            autoComplete="email"
            required
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            ref={passwordRef}
            type="password"
            placeholder="Buat password baru"
            autoComplete="new-password"
            required
            minLength={8}
          />

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>

          <Link to="/login" className="auth-link">
            Sudah punya akun?
          </Link>

          <div className="auth-divider">
            <span>atau</span>
          </div>

          <button type="button" className="auth-btn-google">
            <span className="auth-g-mark">G</span>
            Lanjutkan dengan Google
          </button>

          <p className="auth-switch">
            Sudah punya akun?{" "}
            <Link to="/login">Masuk di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
}