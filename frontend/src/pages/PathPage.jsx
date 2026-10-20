import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function PathPage() {
  const [path, setPath] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try { setPath((await api.get("/paths/me")).data); setError(""); }
    catch (e) { if (e.response?.status !== 404) setError(errMsg(e)); setPath(null); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function generate() {
    try { setPath((await api.post("/paths/generate")).data); setError(""); }
    catch (e) { setError(errMsg(e)); }
  }

  if (loading) return <p>Loading...</p>;
  return (
    <>
      <div className="row between">
        <h1>My learning path</h1>
        <button onClick={generate}>{path ? "Regenerate path" : "Generate my path"}</button>
      </div>
      {error && <p className="error">{error}</p>}
      {!path && !error && <p className="muted">No path yet. Generate one from your profile and quiz results.</p>}
      {path && (
        <>
          <p className="muted">Goal: {path.careerGoal}</p>
          {path.steps.length === 0 && <p>You have passed every skill in this domain. Great job!</p>}
          <ol className="tree">
            {path.steps.map((s) => (
              <li key={s.skillId} className={`node ${s.status.toLowerCase()}`}>
                <span className="dot">{s.status === "COMPLETED" ? "✓" : s.order}</span>
                <div>
                  <strong>{s.skillName}</strong>
                  <div className="muted">{s.status.replace("_", " ")} · proficiency {s.proficiency}%</div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}