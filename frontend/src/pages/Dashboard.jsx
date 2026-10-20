import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  PointElement, LineElement, RadialLinearScale, Filler,
} from "chart.js";
import { Doughnut, Line, Radar } from "react-chartjs-2";
import api, { errMsg } from "../api";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  PointElement, LineElement, RadialLinearScale, Filler);

export default function Dashboard() {
  const [sum, setSum] = useState(null);
  const [badges, setBadges] = useState([]);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setSum((await api.get("/dashboard/summary")).data);
        setBadges((await api.get("/badges")).data);
        try { setSteps((await api.get("/paths/me")).data.steps); } catch { /* no path yet */ }
      } catch (e) { setError(errMsg(e)); }
    })();
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!sum) return <p>Loading...</p>;

  const done = sum.stepsCompleted;
  const left = Math.max(sum.stepsTotal - done, 0);

  return (
    <>
      <h1>Your progress</h1>
      <div className="stats">
        <div className="card stat"><span className="big">{sum.points}</span>Points</div>
        <div className="card stat"><span className="big">{sum.streakDays}</span>Day streak</div>
        <div className="card stat"><span className="big">{sum.resourcesCompleted}</span>Resources done</div>
        <div className="card stat"><span className="big">{Math.round(sum.averageScore)}%</span>Average score</div>
      </div>

      <div className="grid charts">
        <div className="card">
          <h3>Path completion</h3>
          {sum.stepsTotal === 0 ? (
            <p className="muted">No path yet. <Link to="/path">Generate one</Link>.</p>
          ) : (
            <Doughnut data={{ labels: ["Completed", "Remaining"],
              datasets: [{ data: [done, left], backgroundColor: ["#16a34a", "#cbd5e1"] }] }} />
          )}
        </div>

        <div className="card">
          <h3>Score trend</h3>
          {sum.scoreTrend.length === 0 ? (
            <p className="muted">Take an <Link to="/assessment">assessment</Link> to see your scores.</p>
          ) : (
            <Line data={{
              labels: sum.scoreTrend.map((p) => new Date(p.takenAt).toLocaleDateString()),
              datasets: [{ label: "Score %", data: sum.scoreTrend.map((p) => p.score),
                borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.15)", fill: true, tension: 0.3 }],
            }} options={{ scales: { y: { min: 0, max: 100 } } }} />
          )}
        </div>

        <div className="card">
          <h3>Skill proficiency</h3>
          {steps.length < 3 ? (
            <p className="muted">Needs at least 3 skills in your path.</p>
          ) : (
            <Radar data={{
              labels: steps.map((s) => s.skillName),
              datasets: [{ label: "Proficiency", data: steps.map((s) => s.proficiency),
                borderColor: "#9333ea", backgroundColor: "rgba(147,51,234,.2)" }],
            }} options={{ scales: { r: { min: 0, max: 100 } } }} />
          )}
        </div>
      </div>

      <h2>Badges</h2>
      <div className="grid">
        {badges.map((b) => (
          <div key={b.code} className={`card badge ${b.earned ? "earned" : "locked"}`}>
            <strong>{b.earned ? "🏅 " : "🔒 "}{b.name}</strong>
            <span className="muted">{b.description}</span>
          </div>
        ))}
      </div>
    </>
  );
}