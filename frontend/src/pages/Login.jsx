import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Sparkles, Sun, Moon } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import { useTheme } from "../ThemeContext";
import api, { errMsg } from "../api";

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      try {
        await api.get("/profile");
        nav("/dashboard");
      } catch {
        nav("/onboarding");
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-theme-corner">
        <button
          type="button"
          className="theme-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="auth-card-box">
        <div className="auth-brand-header">
          <div className="brand-logo-large">
            <Sparkles size={28} />
          </div>
          <h1>Learning Path</h1>
          <p className="auth-subtitle">Sign in to resume your personalized curriculum</p>
        </div>

        <form className="card auth-form-card" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              <Mail size={15} className="label-icon" />
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              <Lock size={15} className="label-icon" />
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: "right", marginTop: "-6px", marginBottom: "16px" }}>
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: "0.85rem" }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary w-full row-btn">
            <LogIn size={16} />
            <span>{busy ? "Signing in..." : "Log in"}</span>
          </button>

          <p className="auth-footer-text">
            New here? <Link to="/register" className="auth-link">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}