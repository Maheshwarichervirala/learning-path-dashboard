import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errMsg } from "../api";

export default function Onboarding() {
  const nav = useNavigate();
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [experienceLevel, setLevel] = useState("Beginner");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/skills/domains")
      .then((r) => { setDomains(r.data); if (r.data[0]) setDomain(r.data[0]); })
      .catch((e) => setError(errMsg(e)));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.put("/profile", { domain, careerGoal, experienceLevel });
      nav("/assessment");
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>Set up your profile</h1>
      <p className="muted">Tell us what you want to learn. You can change this later.</p>
      {error && <p className="error">{error}</p>}
      <label>Domain
        <select value={domain} onChange={(e) => setDomain(e.target.value)}>
          {domains.map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label>Career goal
        <input placeholder="e.g. Frontend Developer" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} required />
      </label>
      <label>Experience level
        <select value={experienceLevel} onChange={(e) => setLevel(e.target.value)}>
          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
        </select>
      </label>
      <button>Save and take an assessment</button>
    </form>
  );
}