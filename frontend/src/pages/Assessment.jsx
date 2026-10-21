import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Route as RouteIcon,
  RotateCcw,
  Sparkles,
  BarChart,
  ChevronRight,
  History,
  TrendingUp,
  Trophy,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useToast } from "../ToastContext";
import { AssessmentSkeleton } from "../components/Skeleton";

function HistorySection({ history, skillName }) {
  if (!history || history.length === 0) return null;

  const bestScore = Math.max(...history.map((h) => h.score));
  const chronological = [...history].reverse();
  const width = 280;
  const height = 54;
  const pad = 12;

  const points = chronological.map((pt, i) => {
    const x =
      chronological.length === 1
        ? width / 2
        : pad + (i / (chronological.length - 1)) * (width - 2 * pad);
    const y = height - pad - (pt.score / 100) * (height - 2 * pad);
    return { x, y, score: pt.score, takenAt: pt.takenAt };
  });

  const pointsString = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints =
    chronological.length > 1
      ? `${points[0].x},${height} ${pointsString} ${points[points.length - 1].x},${height}`
      : "";

  return (
    <div className="assessment-history-section">
      <div className="history-header">
        <div className="history-title-group">
          <History size={18} className="text-primary" />
          <h3>Attempt History {skillName ? `for ${skillName}` : ""}</h3>
        </div>
        <div className="best-score-badge">
          <Trophy size={14} />
          <span>Best: {bestScore}%</span>
        </div>
      </div>

      {/* Small SVG Trend Line */}
      <div className="trend-container">
        <div className="trend-label">
          <TrendingUp size={14} />
          <span>Score Progression</span>
        </div>
        <div className="sparkline-wrapper">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="sparkline-svg"
            role="img"
            aria-label="Score progression sparkline"
          >
            <defs>
              <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {chronological.length > 1 && (
              <>
                <polygon points={areaPoints} fill="url(#sparkline-grad)" />
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="var(--primary)"
                  stroke="var(--bg-surface)"
                  strokeWidth="2"
                />
                <title>{`${p.score}% on ${new Date(p.takenAt).toLocaleDateString()}`}</title>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Past Attempts List */}
      <div className="history-list">
        {history.slice(0, 5).map((att, i) => {
          const isPass = att.score >= 70;
          const formattedDate = new Date(att.takenAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={i} className="history-item">
              <div className="history-item-left">
                <span
                  className={`history-score-chip ${
                    isPass ? "history-score-pass" : "history-score-fail"
                  }`}
                >
                  {att.score}%
                </span>
                <span>
                  {att.correct} / {att.total} correct
                </span>
              </div>
              <span className="history-meta">{formattedDate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Assessment() {
  const [searchParams] = useSearchParams();
  const querySkillId = searchParams.get("skillId");
  const toast = useToast();

  const [skills, setSkills] = useState([]);
  const [skill, setSkill] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = (await api.get("/profile")).data;
        const sRes = await api.get("/skills", { params: { domain: p.domain } });
        if (mounted) {
          const loadedSkills = sRes.data || [];
          setSkills(loadedSkills);

          // If query param skillId is present, auto-pick it
          if (querySkillId) {
            const target = loadedSkills.find((s) => String(s.id) === String(querySkillId));
            if (target) {
              pick(target);
            }
          }
        }
      } catch (e) {
        if (e.response?.status === 404) {
          toast.info("Please set up your profile domain first.");
        } else {
          toast.error(errMsg(e));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [querySkillId]);

  async function pick(s) {
    setSkill(s);
    setResult(null);
    setAnswers({});
    try {
      const [qRes, hRes] = await Promise.allSettled([
        api.get(`/assessments/${s.id}`),
        api.get("/assessments/history", { params: { skillId: s.id } }),
      ]);

      if (qRes.status === "fulfilled") {
        const rawQuestions = qRes.value.data || [];
        // Shuffle option order for display, but keep track of originalIndex for scoring
        const prepared = rawQuestions.map((q) => {
          const indexed = (q.options || []).map((opt, origIdx) => ({
            text: opt,
            originalIndex: origIdx,
          }));
          // Fisher-Yates shuffle
          const shuffled = [...indexed];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return {
            ...q,
            shuffledOptions: shuffled,
          };
        });
        setQuestions(prepared);
      } else {
        toast.error(errMsg(qRes.reason));
      }

      if (hRes.status === "fulfilled") {
        setHistory(hRes.value.data || []);
      }
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const r = (await api.post("/assessments/submit", { skillId: skill.id, answers })).data;
      setResult(r);

      // Refresh history immediately so the new attempt is included
      try {
        const hRes = await api.get("/assessments/history", { params: { skillId: skill.id } });
        setHistory(hRes.data || []);
      } catch {
        // non-blocking
      }

      if (r.passed) {
        toast.success(`Passed with ${r.score}%! Skill proficiency updated.`);
      } else {
        toast.info(`Scored ${r.score}%. Practice recommended before retrying.`);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AssessmentSkeleton />;

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="assessment-page">
      <div className="page-header">
        <h1>Skill Assessment</h1>
        <p className="page-subtitle">
          Test your subject-matter mastery and calibrate your roadmap difficulty
        </p>
      </div>

      {/* Skill Selection Grid */}
      {!skill && (
        <div className="skills-selection-section">
          <h2>Select a skill to assess</h2>
          {skills.length === 0 ? (
            <div className="card empty-state-card text-center">
              <p className="muted">No skills found for your profile domain. Please check your profile.</p>
              <Link to="/profile" className="btn btn-primary">
                Go to Profile
              </Link>
            </div>
          ) : (
            <div className="grid skills-grid">
              {skills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="card tile skill-card"
                  onClick={() => pick(s)}
                >
                  <div className="skill-card-content">
                    <strong className="skill-name">{s.name}</strong>
                    <div className="skill-meta-row">
                      <span className="difficulty-pill">Level {s.difficulty}</span>
                      <span className="start-test-hint">
                        <span>Take quiz</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Quiz Card */}
      {skill && !result && (
        <div className="card quiz-card">
          <div className="quiz-card-header row between">
            <div>
              <span className="quiz-eyebrow">Skill Assessment</span>
              <h2>{skill.name}</h2>
            </div>
            <span className="questions-counter">
              {Object.keys(answers).length} of {questions.length} Answered
            </span>
          </div>

          {questions.length === 0 && (
            <div className="empty-quiz-notice">
              <AlertCircle size={32} className="notice-icon" />
              <p className="muted">No quiz questions are available for this skill yet.</p>
              <button
                type="button"
                className="btn btn-secondary row-btn"
                onClick={() => setSkill(null)}
              >
                <ArrowLeft size={16} />
                <span>Choose another skill</span>
              </button>
            </div>
          )}

          {questions.map((q, qi) => (
            <fieldset key={q.id} className="quiz-fieldset">
              <legend className="quiz-legend">
                <span className="question-number">{qi + 1}</span>
                <span className="question-text">{q.text}</span>
              </legend>
              <div className="quiz-options-grid">
                {(q.shuffledOptions || []).map((opt, oi) => {
                  const isChecked = answers[q.id] === opt.originalIndex;
                  return (
                    <label
                      key={oi}
                      className={`option-card ${isChecked ? "option-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        checked={isChecked}
                        onChange={() =>
                          setAnswers({ ...answers, [q.id]: opt.originalIndex })
                        }
                      />
                      <span className="option-label-text">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {questions.length > 0 && (
            <div className="quiz-actions row between">
              <button
                type="button"
                className="btn btn-secondary row-btn"
                onClick={() => setSkill(null)}
              >
                <ArrowLeft size={16} />
                <span>Back to skills</span>
              </button>

              <button
                type="button"
                className="btn btn-primary row-btn"
                disabled={!allAnswered || submitting}
                onClick={submit}
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? "Evaluating..." : "Submit Answers"}</span>
              </button>
            </div>
          )}

          {/* History Section on Active Assessment Screen */}
          <HistorySection history={history} skillName={skill.name} />
        </div>
      )}

      {/* Quiz Result Summary Card */}
      {result && (
        <div className={`card result-card ${result.passed ? "result-passed" : "result-failed"}`}>
          <div className="result-icon-box">
            {result.passed ? (
              <Sparkles size={44} className="result-icon success" />
            ) : (
              <BarChart size={44} className="result-icon practice" />
            )}
          </div>

          <h2>{result.passed ? "Assessment Passed!" : "Needs More Practice"}</h2>
          <div className="result-score-callout">{result.score}%</div>

          <p className="result-summary-text">
            You scored <strong>{result.correct}</strong> out of <strong>{result.total}</strong> correct.
            Calibrated level: <span className="level-badge">{result.level}</span>
          </p>

          <div className="result-actions row">
            <button
              type="button"
              className="btn btn-secondary row-btn"
              onClick={() => pick(skill)}
            >
              <RotateCcw size={16} />
              <span>Retake this quiz</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary row-btn"
              onClick={() => {
                setSkill(null);
                setResult(null);
              }}
            >
              <ArrowLeft size={16} />
              <span>All skills</span>
            </button>

            <Link className="btn btn-primary row-btn" to="/path">
              <RouteIcon size={16} />
              <span>View learning path</span>
            </Link>
          </div>

          {/* History Section on Result Screen */}
          <HistorySection history={history} skillName={skill?.name} />
        </div>
      )}
    </div>
  );
}