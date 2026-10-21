import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import api, { errMsg } from "../api";
import { useToast } from "../ToastContext";

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data?.message || "If an account with that email exists, password reset instructions have been sent.");
      setSubmitted(true);
      toast.success("Instructions sent");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card-box">
        <div className="auth-brand-header">
          <div className="brand-logo-large">
            <Sparkles size={28} />
          </div>
          <h1>Reset Password</h1>
          <p className="auth-subtitle">Enter your email and we'll send you recovery instructions</p>
        </div>

        <div className="card auth-form-card">
          {submitted ? (
            <div className="text-center" style={{ padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <CheckCircle2 size={48} color="#10b981" />
              </div>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Check Your Inbox</h2>
              <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "24px" }}>
                {message}
              </p>
              <Link to="/login" className="btn btn-secondary w-full row-btn">
                <ArrowLeft size={16} />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="form-group">
                <label htmlFor="forgot-email" className="form-label">
                  <Mail size={15} className="label-icon" />
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={busy} className="btn btn-primary w-full row-btn" style={{ marginTop: "8px" }}>
                <Mail size={16} />
                <span>{busy ? "Sending..." : "Send Reset Link"}</span>
              </button>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
