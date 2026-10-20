import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recommendations")
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  async function complete(id) {
    try {
      const s = (await api.post("/progress/complete", { resourceId: id })).data;
      setItems((list) => list.filter((r) => r.id !== id));
      setMsg(`Completed! You now have ${s.points} points and a ${s.streakDays}-day streak.`);
    } catch (e) { setError(errMsg(e)); }
  }

  if (loading) return <p>Loading...</p>;
  return (
    <>
      <h1>Recommended resources</h1>
      {msg && <p className="success">{msg}</p>}
      {error && <p className="error">{error}</p>}
      {items.length === 0 && !error && (
        <p className="muted">Nothing to show yet. Generate a learning path first, or you have completed everything.</p>
      )}
      <div className="grid">
        {items.map((r) => (
          <div key={r.id} className="card">
            <span className="chip">{r.type}</span>
            <h3>{r.title}</h3>
            <p className="muted">Rating {r.rating ?? "n/a"} · {r.source}</p>
            <div className="row">
              <a className="btn secondary" href={r.url} target="_blank" rel="noopener noreferrer">Open</a>
              <button onClick={() => complete(r.id)}>Mark complete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}