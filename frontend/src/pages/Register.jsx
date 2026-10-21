import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, User, Mail, Lock, Sparkles, Sun, Moon } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import { useTheme } from "../ThemeContext";
import { errMsg } from "../api";

export default function Register() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(name, email, password);
      toast.success("Account created successfully! Welcome aboard.");
      nav("/onboarding");
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
          <p className="auth-subtitle">Create an account to start your customized curriculum</p>
        </div>

        <form className="card auth-form-card" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="register-name" className="form-label">
              <User size={15} className="label-icon" />
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              className="form-control"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email" className="form-label">
              <Mail size={15} className="label-icon" />
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              className="form-control"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password" className="form-label">
              <Lock size={15} className="label-icon" />
              Password (8+ characters)
            </label>
            <input
              id="register-password"
              type="password"
              minLength={8}
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary w-full row-btn">
            <UserPlus size={16} />
            <span>{busy ? "Creating account..." : "Sign up"}</span>
          </button>

          <p className="auth-footer-text">
            Already registered? <Link to="/login" className="auth-link">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}