import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Target, Award, User, ArrowRight } from "lucide-react";
import api, { errMsg } from "../api";
import { useToast } from "../ToastContext";

export default function Onboarding() {
  const nav = useNavigate();
  const toast = useToast();

  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [experienceLevel, setLevel] = useState("Beginner");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/skills/domains")
      .then((r) => {
        setDomains(r.data);
        if (r.data[0]) setDomain(r.data[0]);
      })
      .catch((e) => toast.error(errMsg(e)));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/profile", { domain, careerGoal, experienceLevel });
      toast.success("Profile saved! Time to calibrate your skills.");
      nav("/assessment");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-container">
      <form className="card narrow onboarding-card" onSubmit={submit}>
        <div className="onboarding-badge">
          <Sparkles size={24} className="sparkle-icon" />
        </div>
        <h1>Set up your profile</h1>
        <p className="muted">Tell us what you want to learn so we can personalize your learning path.</p>

        <div className="form-group">
          <label htmlFor="onboard-domain" className="form-label">
            <Target size={15} className="label-icon" />
            Domain
          </label>
          <select
            id="onboard-domain"
            className="form-control"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            {domains.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="onboard-goal" className="form-label">
            <Award size={15} className="label-icon" />
            Career Goal
          </label>
          <input
            id="onboard-goal"
            className="form-control"
            placeholder="e.g. Frontend Developer"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="onboard-level" className="form-label">
            <User size={15} className="label-icon" />
            Experience Level
          </label>
          <select
            id="onboard-level"
            className="form-control"
            value={experienceLevel}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full row-btn" disabled={saving}>
          <span>{saving ? "Saving..." : "Save and take an assessment"}</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}