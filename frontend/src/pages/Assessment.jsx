import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";

export default function Assessment() {
  const [skills, setSkills] = useState([]);
  const [skill, setSkill] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = (await api.get("/profile")).data;
        setSkills((await api.get("/skills", { params: { domain: p.domain } })).data);
      } catch (e) {
        setError(e.response?.status === 404 ? "Please complete onboarding first." : errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function pick(s) {
    setSkill(s); setResult(null); setAnswers({}); setError("");
    try { setQuestions((await api.get(`/assessments/${s.id}`)).data); }
    catch (e) { setError(errMsg(e)); }
  }

  async function submit() {
    try { setResult((await api.post("/assessments/submit", { skillId: skill.id, answers })).data); }
    catch (e) { setError(errMsg(e)); }
  }

  if (loading) return <p>Loading...</p>;
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <>
      <h1>Skill assessment</h1>
      {error && <p className="error">{error}</p>}
      {!skill && (
        <div className="grid">
          {skills.map((s) => (
            <button key={s.id} className="card tile" onClick={() => pick(s)}>
              <strong>{s.name}</strong>
              <span className="muted">Difficulty {s.difficulty}</span>
            </button>
          ))}
        </div>
      )}

      {skill && !result && (
        <div className="card">
          <h2>{skill.name}</h2>
          {questions.length === 0 && <p className="muted">No quiz is available for this skill yet.</p>}
          {questions.map((q, qi) => (
            <fieldset key={q.id}>
              <legend>{qi + 1}. {q.text}</legend>
              {q.options.map((o, oi) => (
                <label key={oi} className="option">
                  <input type="radio" name={`q${q.id}`} checked={answers[q.id] === oi}
                    onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                  {o}
                </label>
              ))}
            </fieldset>
          ))}
          <div className="row">
            <button className="secondary" onClick={() => setSkill(null)}>Back</button>
            {questions.length > 0 && <button disabled={!allAnswered} onClick={submit}>Submit</button>}
          </div>
        </div>
      )}

      {result && (
        <div className="card">
          <h2>{result.passed ? "Nice work!" : "Keep practising"}</h2>
          <p className="big">{result.score}%</p>
          <p>{result.correct} of {result.total} correct. Level: <strong>{result.level}</strong></p>
          <div className="row">
            <button className="secondary" onClick={() => { setSkill(null); setResult(null); }}>Another skill</button>
            <Link className="btn" to="/path">Update my learning path</Link>
          </div>
        </div>
      )}
    </>
  );
}