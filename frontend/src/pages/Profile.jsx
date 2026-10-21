import { useEffect, useState } from "react";
import { User, Mail, Briefcase, Target, Award, LogOut, Save, Lock } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import api, { errMsg } from "../api";
import { ProfileSkeleton } from "../components/Skeleton";

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Beginner");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success(res.data?.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setChangingPassword(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [domRes, profRes] = await Promise.allSettled([
          api.get("/skills/domains"),
          api.get("/api/profile"),
        ]);

        if (domRes.status === "fulfilled") {
          setDomains(domRes.value.data);
        }

        if (profRes.status === "fulfilled" && profRes.value.data) {
          const p = profRes.value.data;
          if (mounted) {
            setDomain(p.domain || "");
            setCareerGoal(p.careerGoal || "");
            setExperienceLevel(p.experienceLevel || "Beginner");
          }
        }
      } catch (err) {
        toast.error(errMsg(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/profile", { domain, careerGoal, experienceLevel });
      toast.success("Profile saved successfully!");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Your Profile</h1>
        <p className="page-subtitle">Manage your personal learning goals and preferences</p>
      </div>

      <div className="profile-grid">
        {/* User Identity Card */}
        <div className="card user-summary-card">
          <div className="user-avatar-large">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <h2 className="user-display-name">{user?.name}</h2>
          <div className="user-email-badge">
            <Mail size={15} />
            <span>{user?.email}</span>
          </div>

          <hr className="divider" />

          <button
            type="button"
            className="btn btn-outline-danger w-full row-btn"
            onClick={logout}
            aria-label="Log out of account"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>

        {/* Learning Preferences Edit Form */}
        <div className="card profile-form-card">
          <h2 className="card-heading">
            <Briefcase size={20} className="heading-icon" />
            Learning Preferences
          </h2>

          <form onSubmit={handleSave} className="form-stack">
            <div className="form-group">
              <label htmlFor="domain-select" className="form-label">
                <Target size={15} className="label-icon" />
                Domain
              </label>
              <select
                id="domain-select"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="form-control"
                required
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="goal-input" className="form-label">
                <Award size={15} className="label-icon" />
                Career Goal
              </label>
              <input
                id="goal-input"
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="experience-select" className="form-label">
                <User size={15} className="label-icon" />
                Experience Level
              </label>
              <select
                id="experience-select"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="form-control"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={saving} className="btn btn-primary row-btn">
                <Save size={16} />
                <span>{saving ? "Saving..." : "Save changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card profile-form-card" style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
          <h2 className="card-heading">
            <Lock size={20} className="heading-icon" />
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="form-stack" style={{ maxWidth: "560px" }}>
            <div className="form-group">
              <label htmlFor="current-password" className="form-label">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password" className="form-label">
                New Password (minimum 8 characters)
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control"
                minLength={8}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-new-password" className="form-label">
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="form-control"
                minLength={8}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={changingPassword} className="btn btn-primary row-btn">
                <Lock size={16} />
                <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
