import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import api, { errMsg } from "../api";
import { useToast } from "../ToastContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const nav = useNavigate();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!token) {
      toast.error("No reset token found in URL. Please use the link provided in your email.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post("/auth/reset-password", { token, newPassword });
      toast.success(res.data?.message || "Password reset successful! Please log in.");
      nav("/login");
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
          <h1>Set New Password</h1>
          <p className="auth-subtitle">Create a secure new password for your account</p>
        </div>

        <form className="card auth-form-card" onSubmit={submit}>
          {!token && (
            <div className="notice-box" style={{ background: "var(--danger-light)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", marginBottom: "var(--space-4)", color: "var(--danger)", fontSize: "var(--font-size-sm)" }}>
              Warning: Reset token is missing from the URL. Please verify your email link.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reset-new-password" className="form-label">
              <Lock size={15} className="label-icon" />
              New Password (min 8 characters)
            </label>
            <input
              id="reset-new-password"
              type="password"
              className="form-control"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm-password" className="form-label">
              <Lock size={15} className="label-icon" />
              Confirm New Password
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <button type="submit" disabled={busy || !token} className="btn btn-primary w-full row-btn" style={{ marginTop: "8px" }}>
            <CheckCircle2 size={16} />
            <span>{busy ? "Updating..." : "Reset Password"}</span>
          </button>

          <p className="auth-footer-text">
            Remember your credentials? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
