import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
} from "chart.js";
import { Doughnut, Line, Radar } from "react-chartjs-2";
import {
  Flame,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  Route as RouteIcon,
  GraduationCap,
  Lock,
  ArrowRight,
  Target,
  Clock,
  ChevronUp,
  ChevronDown,
  Bell,
  Minus,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useToast } from "../ToastContext";
import { useTheme } from "../ThemeContext";
import { getXpLevel } from "../utils/xp";
import { DashboardSkeleton } from "../components/Skeleton";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
);

export default function Dashboard() {
  const toast = useToast();
  const { theme } = useTheme();

  const [sum, setSum] = useState(null);
  const [badges, setBadges] = useState([]);
  const [steps, setSteps] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [goal, setGoal] = useState({ target: 1, completedToday: 0, met: false });
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingGoal, setUpdatingGoal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [sumRes, badgeRes, pathRes, levelRes, goalRes, weeklyRes] =
          await Promise.allSettled([
            api.get("/dashboard/summary"),
            api.get("/badges"),
            api.get("/paths/me"),
            api.get("/me/level"),
            api.get("/goals"),
            api.get("/dashboard/weekly"),
          ]);

        if (sumRes.status === "fulfilled" && mounted) {
          setSum(sumRes.value.data);
        } else if (sumRes.status === "rejected") {
          toast.error(errMsg(sumRes.reason));
        }

        if (badgeRes.status === "fulfilled" && mounted) {
          setBadges(badgeRes.value.data || []);
        }

        if (pathRes.status === "fulfilled" && mounted && pathRes.value.data?.steps) {
          setSteps(pathRes.value.data.steps);
        }

        if (levelRes.status === "fulfilled" && mounted && levelRes.value.data) {
          setLevelInfo(levelRes.value.data);
        }

        if (goalRes.status === "fulfilled" && mounted && goalRes.value.data) {
          setGoal(goalRes.value.data);
        }

        if (weeklyRes.status === "fulfilled" && mounted && weeklyRes.value.data) {
          setWeekly(weeklyRes.value.data);
        }
      } catch (e) {
        toast.error(errMsg(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleTargetChange(newTarget) {
    if (newTarget < 1 || newTarget > 5 || updatingGoal) return;
    setUpdatingGoal(true);
    try {
      const res = await api.put("/goals", { target: newTarget });
      setGoal(res.data);
      if (res.data.met) {
        toast.success("Goal met! Great job staying consistent today!");
      } else {
        toast.info(`Daily goal set to ${newTarget} resource${newTarget > 1 ? "s" : ""}`);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setUpdatingGoal(false);
    }
  }

  if (loading || !sum) return <DashboardSkeleton />;

  const done = sum.stepsCompleted;
  const left = Math.max(sum.stepsTotal - done, 0);

  // Dynamic chart colors for theme adaptation
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor, boxWidth: 12, padding: 14 },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, maxRotation: 45 },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: gridColor },
        ticks: { color: textColor, callback: (v) => `${v}%` },
      },
    },
  };

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: gridColor },
        angleLines: { color: gridColor },
        pointLabels: { color: textColor, font: { size: 11 } },
        ticks: { display: false, stepSize: 25 },
      },
    },
  };

  const xpInfo = getXpLevel(sum.points);
  const isAfter6PM = new Date().getHours() >= 18;
  const showEveningReminder = isAfter6PM && !goal.met;

  // Ring calculation for daily goal (circle r=40, circumference ~ 251.3)
  const ringRadius = 40;
  const circumference = 2 * Math.PI * ringRadius;
  const goalProgressFraction = Math.min(goal.completedToday / (goal.target || 1), 1);
  const strokeDashoffset = circumference - goalProgressFraction * circumference;

  function renderDiff(cur, prev, suffix = "") {
    const diff = cur - prev;
    if (diff > 0) {
      return (
        <span className="diff-up text-success row" style={{ gap: "2px", alignItems: "center", fontSize: "0.8rem" }}>
          <ChevronUp size={14} /> +{diff}{suffix}
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="diff-down" style={{ color: "#ef4444", display: "inline-flex", gap: "2px", alignItems: "center", fontSize: "0.8rem" }}>
          <ChevronDown size={14} /> {diff}{suffix}
        </span>
      );
    }
    return (
      <span className="muted row" style={{ gap: "2px", alignItems: "center", fontSize: "0.8rem" }}>
        <Minus size={13} /> same
      </span>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Evening Reminder Banner for Unmet Goal after 6 PM */}
      {showEveningReminder && (
        <div className="card reminder-banner-card">
          <div className="reminder-banner-content">
            <div className="reminder-banner-icon-box">
              <Bell size={20} />
            </div>
            <div className="reminder-banner-text">
              <strong className="reminder-banner-title">Evening Learning Reminder</strong>
              <p className="reminder-banner-desc">
                It&apos;s past 6 PM and you have completed <strong>{goal.completedToday}</strong> of{" "}
                <strong>{goal.target}</strong> resource{goal.target > 1 ? "s" : ""} today. Keep your streak alive!
              </p>
            </div>
          </div>
          <div className="reminder-banner-actions">
            <Link to="/recommendations" className="btn btn-primary btn-sm reminder-action-btn">
              <span>Finish Daily Goal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Page Header with XP Level & Progress */}
      <div className="page-header">
        <div className="row between wrap" style={{ alignItems: "center", gap: "16px" }}>
          <div>
            <h1>Your Learning Overview</h1>
            <p className="page-subtitle">Track your milestones, metrics, and achievements</p>
          </div>

          {/* XP Level Card */}
          <div
            className="card"
            style={{
              padding: "12px 18px",
              minWidth: "260px",
              background: "linear-gradient(135deg, var(--bg-surface), var(--primary-light))",
              borderColor: "var(--primary-border)",
            }}
          >
            <div className="row between" style={{ marginBottom: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Rank: <span style={{ color: "var(--primary)" }}>{xpInfo.level}</span>
              </span>
              <span className="badge-pill" style={{ fontSize: "0.75rem" }}>
                {xpInfo.current} XP
              </span>
            </div>
            <div
              style={{
                height: "6px",
                borderRadius: "999px",
                background: "var(--bg-muted)",
                overflow: "hidden",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  width: `${xpInfo.pct}%`,
                  height: "100%",
                  background: "var(--primary)",
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div className="row between" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              <span>{xpInfo.min} XP</span>
              {xpInfo.needed > 0 ? (
                <span>{xpInfo.needed} XP to next level</span>
              ) : (
                <span>Max level reached!</span>
              )}
              <span>{xpInfo.next} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Grid: Rebalanced 4-Card Unified Grid */}
      <div className="dashboard-top-grid">
        {/* Card 1: Daily Goal Card with Circular Progress Ring */}
        <div className="card stat-card goal-stat-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px", justifyContent: "space-between" }}>
          <div className="row between" style={{ alignItems: "center", width: "100%" }}>
            <span className="stat-label">Daily Goal</span>
            {goal.met ? (
              <span className="badge-pill" style={{ background: "var(--success-light)", color: "var(--success)", border: "1px solid var(--success-border)", fontSize: "0.72rem" }}>
                ✓ Goal Met
              </span>
            ) : (
              <span className="badge-pill" style={{ fontSize: "0.72rem", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-border)" }}>
                In Progress
              </span>
            )}
          </div>

          <div className="row" style={{ alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative", width: "76px", height: "76px", flexShrink: 0 }}>
              <svg width="76" height="76" viewBox="0 0 90 90">
                <defs>
                  <linearGradient id="goalProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="goalSuccessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={goal.met ? "rgba(16, 185, 129, 0.4)" : "rgba(99, 102, 241, 0.4)"} />
                  </filter>
                </defs>
                <circle
                  cx="45"
                  cy="45"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--bg-muted)"
                  strokeWidth="8"
                />
                <circle
                  cx="45"
                  cy="45"
                  r={ringRadius}
                  fill="none"
                  stroke={goal.met ? "url(#goalSuccessGrad)" : "url(#goalProgressGrad)"}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="url(#ringGlow)"
                  transform="rotate(-90 45 45)"
                  style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {goal.completedToday}/{goal.target}
                </span>
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Today
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="muted" style={{ fontSize: "0.8rem", margin: "0 0 6px" }}>
                Target: <strong>{goal.target}</strong> resource{goal.target > 1 ? "s" : ""}
              </p>
              <div className="row" style={{ gap: "3px", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginRight: "2px" }}>Set:</span>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={updatingGoal}
                    onClick={() => handleTargetChange(num)}
                    className={`btn btn-sm ${goal.target === num ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "1px 6px", fontSize: "0.72rem", minWidth: "22px", height: "22px" }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Points */}
        <div className="card stat-card" style={{ padding: "18px 20px" }}>
          <div className="stat-icon-wrapper flame-bg">
            <Flame size={24} className="stat-icon flame" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Points</span>
            <span className="stat-number">{sum.points}</span>
          </div>
        </div>

        {/* Card 3: Streak */}
        <div className="card stat-card" style={{ padding: "18px 20px" }}>
          <div className="stat-icon-wrapper streak-bg">
            <Sparkles size={24} className="stat-icon streak" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Day Streak</span>
            <span className="stat-number">
              {sum.streakDays} <small>days</small>
            </span>
          </div>
        </div>

        {/* Card 4: Resources Done */}
        <div className="card stat-card" style={{ padding: "18px 20px" }}>
          <div className="stat-icon-wrapper completed-bg">
            <CheckCircle2 size={24} className="stat-icon completed" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Resources Done</span>
            <span className="stat-number">{sum.resourcesCompleted}</span>
          </div>
        </div>
      </div>

      {/* "This Week" Activity Comparison Card */}
      {weekly && (
        <div
          className="card"
          style={{
            padding: "20px 24px",
            marginBottom: "24px",
            background: "var(--bg-surface)",
          }}
        >
          <div className="row between wrap" style={{ marginBottom: "16px" }}>
            <div className="row" style={{ gap: "8px", alignItems: "center" }}>
              <TrendingUp size={20} className="text-primary" />
              <h3 style={{ margin: 0, fontSize: "1.15rem" }}>This Week vs. Last Week</h3>
            </div>
            <span className="badge-pill">Weekly Performance Review</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Resources Completed */}
            <div className="card" style={{ background: "var(--bg-muted)", padding: "14px", border: "1px solid var(--border)" }}>
              <span className="muted" style={{ fontSize: "0.78rem", display: "block", marginBottom: "4px" }}>
                Resources Finished
              </span>
              <div className="row between" style={{ alignItems: "baseline" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{weekly.thisWeek.resourcesCompleted}</span>
                {renderDiff(weekly.thisWeek.resourcesCompleted, weekly.lastWeek.resourcesCompleted)}
              </div>
              <span className="muted" style={{ fontSize: "0.72rem" }}>Last week: {weekly.lastWeek.resourcesCompleted}</span>
            </div>

            {/* Quizzes Taken */}
            <div className="card" style={{ background: "var(--bg-muted)", padding: "14px", border: "1px solid var(--border)" }}>
              <span className="muted" style={{ fontSize: "0.78rem", display: "block", marginBottom: "4px" }}>
                Quizzes Taken
              </span>
              <div className="row between" style={{ alignItems: "baseline" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{weekly.thisWeek.quizzesTaken}</span>
                {renderDiff(weekly.thisWeek.quizzesTaken, weekly.lastWeek.quizzesTaken)}
              </div>
              <span className="muted" style={{ fontSize: "0.72rem" }}>Last week: {weekly.lastWeek.quizzesTaken}</span>
            </div>

            {/* Points Earned */}
            <div className="card" style={{ background: "var(--bg-muted)", padding: "14px", border: "1px solid var(--border)" }}>
              <span className="muted" style={{ fontSize: "0.78rem", display: "block", marginBottom: "4px" }}>
                Points Earned
              </span>
              <div className="row between" style={{ alignItems: "baseline" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{weekly.thisWeek.pointsEarned}</span>
                {renderDiff(weekly.thisWeek.pointsEarned, weekly.lastWeek.pointsEarned)}
              </div>
              <span className="muted" style={{ fontSize: "0.72rem" }}>Last week: {weekly.lastWeek.pointsEarned} pts</span>
            </div>

            {/* Best Score */}
            <div className="card" style={{ background: "var(--bg-muted)", padding: "14px", border: "1px solid var(--border)" }}>
              <span className="muted" style={{ fontSize: "0.78rem", display: "block", marginBottom: "4px" }}>
                Top Assessment Score
              </span>
              <div className="row between" style={{ alignItems: "baseline" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  {Math.round(weekly.thisWeek.bestScore)}%
                </span>
                {renderDiff(Math.round(weekly.thisWeek.bestScore), Math.round(weekly.lastWeek.bestScore), "%")}
              </div>
              <span className="muted" style={{ fontSize: "0.72rem" }}>Last week: {Math.round(weekly.lastWeek.bestScore)}%</span>
            </div>

            {/* Streak */}
            <div className="card" style={{ background: "var(--bg-muted)", padding: "14px", border: "1px solid var(--border)" }}>
              <span className="muted" style={{ fontSize: "0.78rem", display: "block", marginBottom: "4px" }}>
                Current Streak
              </span>
              <div className="row between" style={{ alignItems: "baseline" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{weekly.thisWeek.streak} d</span>
                <span className="badge-pill" style={{ background: "var(--primary-light)", color: "var(--primary)", fontSize: "0.72rem" }}>
                  Active
                </span>
              </div>
              <span className="muted" style={{ fontSize: "0.72rem" }}>Keep it going today!</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Grid */}
      <div className="charts-grid">
        {/* Doughnut Chart: Path Completion */}
        <div className="card chart-card">
          <div className="card-header-clean">
            <h3>Path Completion</h3>
            <span className="badge-pill">
              {done} / {sum.stepsTotal} Steps
            </span>
          </div>

          <div className="chart-canvas-wrapper">
            {sum.stepsTotal === 0 ? (
              <div className="chart-empty-state">
                <RouteIcon size={36} className="empty-icon" />
                <p>No learning path found yet.</p>
                <Link to="/path" className="btn btn-primary btn-sm row-btn">
                  <span>Generate Path</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <Doughnut
                data={{
                  labels: ["Completed", "Remaining"],
                  datasets: [
                    {
                      data: [done, left],
                      backgroundColor: ["#10b981", isDark ? "#334155" : "#e2e8f0"],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={chartOptions}
              />
            )}
          </div>
        </div>

        {/* Line Chart: Score Trend */}
        <div className="card chart-card">
          <div className="card-header-clean">
            <h3>Assessment Performance</h3>
            <span className="badge-pill">{sum.scoreTrend.length} Tests</span>
          </div>

          <div className="chart-canvas-wrapper">
            {sum.scoreTrend.length === 0 ? (
              <div className="chart-empty-state">
                <GraduationCap size={36} className="empty-icon" />
                <p>Take an assessment to record scores.</p>
                <Link to="/assessment" className="btn btn-primary btn-sm row-btn">
                  <span>Take Quiz</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <Line
                data={{
                  labels: sum.scoreTrend.map((p) =>
                    new Date(p.takenAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  ),
                  datasets: [
                    {
                      label: "Score %",
                      data: sum.scoreTrend.map((p) => p.score),
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59, 130, 246, 0.15)",
                      fill: true,
                      tension: 0.35,
                      pointBackgroundColor: "#3b82f6",
                      pointRadius: 4,
                    },
                  ],
                }}
                options={lineOptions}
              />
            )}
          </div>
        </div>

        {/* Radar Chart: Skill Proficiency */}
        <div className="card chart-card">
          <div className="card-header-clean">
            <h3>Skill Proficiency</h3>
            <span className="badge-pill">Coverage</span>
          </div>

          <div className="chart-canvas-wrapper">
            {steps.length < 3 ? (
              <div className="chart-empty-state">
                <TrendingUp size={36} className="empty-icon" />
                <p>Requires at least 3 path skills to map radar.</p>
                <Link to="/assessment" className="btn btn-primary btn-sm row-btn">
                  <span>Assess Skills</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <Radar
                data={{
                  labels: steps.map((s) => s.skillName),
                  datasets: [
                    {
                      label: "Proficiency %",
                      data: steps.map((s) => s.proficiency),
                      borderColor: "#8b5cf6",
                      backgroundColor: "rgba(139, 92, 246, 0.2)",
                      pointBackgroundColor: "#8b5cf6",
                      pointRadius: 3,
                    },
                  ],
                }}
                options={radarOptions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="badges-section">
        <div className="section-header">
          <h2>Earned Badges & Milestones</h2>
          <span className="badge-pill">
            {badges.filter((b) => b.earned).length} of {badges.length} Unlocked
          </span>
        </div>

        <div className="badges-grid">
          {badges.map((b) => (
            <div
              key={b.code}
              className={`badge-card ${b.earned ? "badge-unlocked" : "badge-locked"}`}
            >
              <div className="badge-icon-box">
                {b.earned ? (
                  <Award size={24} className="badge-award-icon" />
                ) : (
                  <Lock size={20} className="badge-lock-icon" />
                )}
              </div>
              <div className="badge-details">
                <strong className="badge-name">{b.name}</strong>
                <p className="badge-desc">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}