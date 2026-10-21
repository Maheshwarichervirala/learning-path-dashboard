import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GitFork,
  CheckCircle2,
  Lock,
  ArrowRight,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Layers,
  Info,
  BookOpen,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useToast } from "../ToastContext";
import { SkillTreeSkeleton } from "../components/Skeleton";

export default function SkillTree() {
  const toast = useToast();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [path, setPath] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pRes = await api.get("/profile");
        const prof = pRes.data;
        if (mounted) setProfile(prof);

        if (prof?.domain) {
          const [skillsRes, pathRes] = await Promise.allSettled([
            api.get("/skills", { params: { domain: prof.domain } }),
            api.get("/path"),
          ]);

          if (skillsRes.status === "fulfilled" && mounted) {
            setSkills(skillsRes.value.data || []);
          }
          if (pathRes.status === "fulfilled" && mounted) {
            setPath(pathRes.value.data);
          }
        }
      } catch (e) {
        if (e.response?.status !== 404) {
          toast.error(errMsg(e));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const stepBySkillId = useMemo(() => {
    const map = {};
    if (path?.steps) {
      path.steps.forEach((step) => {
        map[step.skillId] = step;
      });
    }
    return map;
  }, [path]);

  const skillById = useMemo(() => {
    const map = {};
    skills.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [skills]);

  // Compute skill states: completed, in_path, locked, available
  const skillStates = useMemo(() => {
    const states = {};

    function isSkillCompleted(id) {
      const step = stepBySkillId[id];
      return step && (step.status === "COMPLETED" || step.proficiency >= 70);
    }

    skills.forEach((s) => {
      if (isSkillCompleted(s.id)) {
        states[s.id] = "completed";
      } else if (s.prerequisiteSkillId && !isSkillCompleted(s.prerequisiteSkillId)) {
        states[s.id] = "locked";
      } else if (stepBySkillId[s.id]) {
        states[s.id] = "in_path";
      } else {
        states[s.id] = "available";
      }
    });

    return states;
  }, [skills, stepBySkillId]);

  // Layered DAG layout calculation
  const layout = useMemo(() => {
    if (skills.length === 0) return { nodes: [], edges: [], width: 800, height: 600 };

    // 1. Calculate depth for each skill
    function getDepth(s) {
      let d = 0;
      let curr = s.prerequisiteSkillId;
      while (curr && skillById[curr] && d < 20) {
        d++;
        curr = skillById[curr].prerequisiteSkillId;
      }
      return d;
    }

    const layers = {};
    let maxDepth = 0;
    skills.forEach((s) => {
      const d = getDepth(s);
      if (!layers[d]) layers[d] = [];
      layers[d].push(s);
      if (d > maxDepth) maxDepth = d;
    });

    const nodeWidth = 190;
    const nodeHeight = 84;
    const colSpacing = 240;
    const rowSpacing = 120;
    const padX = 60;
    const padY = 60;

    const maxRows = Math.max(...Object.values(layers).map((l) => l.length), 1);
    const totalWidth = Math.max(860, (maxDepth + 1) * colSpacing + padX * 2);
    const totalHeight = Math.max(520, maxRows * rowSpacing + padY * 2);

    const nodePositions = {};
    const nodes = [];

    Object.keys(layers).forEach((depthStr) => {
      const d = Number(depthStr);
      const layerSkills = layers[d];
      const count = layerSkills.length;
      const startY = (totalHeight - count * rowSpacing) / 2;

      layerSkills.forEach((s, idx) => {
        const x = padX + d * colSpacing;
        const y = startY + idx * rowSpacing;
        nodePositions[s.id] = { x, y, skill: s };
        nodes.push({ x, y, skill: s });
      });
    });

    // 2. Generate curved edges
    const edges = [];
    skills.forEach((s) => {
      if (s.prerequisiteSkillId && nodePositions[s.prerequisiteSkillId] && nodePositions[s.id]) {
        const from = nodePositions[s.prerequisiteSkillId];
        const to = nodePositions[s.id];

        const x1 = from.x + nodeWidth;
        const y1 = from.y + nodeHeight / 2;
        const x2 = to.x;
        const y2 = to.y + nodeHeight / 2;

        const control1X = x1 + (x2 - x1) * 0.5;
        const control1Y = y1;
        const control2X = x1 + (x2 - x1) * 0.5;
        const control2Y = y2;

        const pathData = `M ${x1} ${y1} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${x2} ${y2}`;
        edges.push({
          fromId: s.prerequisiteSkillId,
          toId: s.id,
          d: pathData,
          state: skillStates[s.id],
        });
      }
    });

    return { nodes, edges, width: totalWidth, height: totalHeight, nodeWidth, nodeHeight };
  }, [skills, skillById, skillStates]);

  if (loading) return <SkillTreeSkeleton />;

  return (
    <div className="skill-tree-page">
      <div className="page-header row between wrap">
        <div>
          <div className="row" style={{ gap: "8px", alignItems: "center" }}>
            <GitFork size={28} className="text-primary" />
            <h1>Prerequisite Skill Tree</h1>
          </div>
          <p className="page-subtitle">
            Visual dependency graph for <strong>{profile?.domain || "your curriculum"}</strong>
          </p>
        </div>

        {/* Legend */}
        <div
          className="row"
          style={{
            gap: "14px",
            background: "var(--bg-surface)",
            padding: "8px 16px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border)",
            fontSize: "0.82rem",
          }}
        >
          <div className="row" style={{ gap: "6px", alignItems: "center" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--success)",
              }}
            />
            <span>Completed</span>
          </div>
          <div className="row" style={{ gap: "6px", alignItems: "center" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--primary)",
              }}
            />
            <span>In Path</span>
          </div>
          <div className="row" style={{ gap: "6px", alignItems: "center" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#6b7280",
              }}
            />
            <span>Locked</span>
          </div>
        </div>
      </div>

      <div
        className="skill-tree-layout"
        style={{
          display: "grid",
          gridTemplateColumns: selectedSkill ? "1fr 340px" : "1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Interactive SVG Canvas */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "auto",
            position: "relative",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            minHeight: "560px",
          }}
        >
          <svg
            width={layout.width}
            height={layout.height}
            style={{ display: "block" }}
            aria-label="Skill prerequisite graph"
          >
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border)" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--primary)" />
              </marker>
              <marker
                id="arrow-completed"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--success)" />
              </marker>
            </defs>

            {/* Connecting Edges */}
            {layout.edges.map((edge, idx) => {
              const isComp = edge.state === "completed";
              const isInPath = edge.state === "in_path";

              return (
                <path
                  key={idx}
                  d={edge.d}
                  fill="none"
                  stroke={
                    isComp
                      ? "var(--success)"
                      : isInPath
                      ? "var(--primary)"
                      : "var(--border)"
                  }
                  strokeWidth={isComp || isInPath ? 2.5 : 1.5}
                  strokeDasharray={edge.state === "locked" ? "4,4" : "none"}
                  markerEnd={
                    isComp
                      ? "url(#arrow-completed)"
                      : isInPath
                      ? "url(#arrow-active)"
                      : "url(#arrow-default)"
                  }
                  style={{ opacity: edge.state === "locked" ? 0.45 : 0.85 }}
                />
              );
            })}

            {/* Nodes */}
            {layout.nodes.map(({ x, y, skill: s }) => {
              const state = skillStates[s.id];
              const isSelected = selectedSkill?.id === s.id;
              const step = stepBySkillId[s.id];
              const prof = step ? Math.round(step.proficiency) : 0;

              let strokeColor = "var(--border)";
              let bgColor = "var(--bg-surface)";
              let textColor = "var(--text-primary)";

              if (state === "completed") {
                strokeColor = "var(--success)";
                bgColor = "var(--success-light)";
              } else if (state === "in_path") {
                strokeColor = "var(--primary)";
                bgColor = "var(--primary-light)";
              } else if (state === "locked") {
                strokeColor = "var(--border)";
                bgColor = "var(--bg-muted)";
                textColor = "var(--text-muted)";
              }

              return (
                <g
                  key={s.id}
                  transform={`translate(${x}, ${y})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedSkill(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedSkill(s);
                  }}
                  aria-label={`${s.name}, state: ${state}`}
                >
                  <rect
                    width={layout.nodeWidth}
                    height={layout.nodeHeight}
                    rx="12"
                    ry="12"
                    fill={bgColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 1.5}
                    style={{
                      filter: isSelected ? "drop-shadow(0 4px 12px rgba(99, 102, 241, 0.35))" : "none",
                      transition: "all 0.2s ease",
                    }}
                  />

                  {/* Header / State Icon */}
                  <g transform="translate(14, 20)">
                    {state === "completed" && (
                      <circle cx="6" cy="6" r="6" fill="var(--success)" />
                    )}
                    {state === "in_path" && (
                      <circle cx="6" cy="6" r="6" fill="var(--primary)" />
                    )}
                    {state === "locked" && (
                      <circle cx="6" cy="6" r="6" fill="#9ca3af" />
                    )}
                  </g>

                  {/* Node Title */}
                  <text
                    x="34"
                    y="24"
                    fill={textColor}
                    fontSize="13"
                    fontWeight="700"
                    style={{ userSelect: "none" }}
                  >
                    {s.name.length > 17 ? s.name.substring(0, 16) + "…" : s.name}
                  </text>

                  {/* Level & Status Subtitle */}
                  <text
                    x="14"
                    y="50"
                    fill="var(--text-secondary)"
                    fontSize="11"
                    fontWeight="500"
                    style={{ userSelect: "none" }}
                  >
                    Level {s.difficulty} •{" "}
                    {state === "completed"
                      ? "Mastered"
                      : state === "in_path"
                      ? "In Roadmap"
                      : state === "locked"
                      ? "Prerequisite Locked"
                      : "Ready"}
                  </text>

                  {/* Proficiency Mini Bar */}
                  {prof > 0 && (
                    <g transform="translate(14, 62)">
                      <rect width="162" height="4" rx="2" fill="var(--bg-muted)" />
                      <rect
                        width={Math.min(162, (162 * prof) / 100)}
                        height="4"
                        rx="2"
                        fill={prof >= 70 ? "var(--success)" : "var(--primary)"}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Skill Details Panel */}
        {selectedSkill && (
          <div className="card skill-detail-panel" style={{ position: "sticky", top: "20px" }}>
            <div className="row between" style={{ marginBottom: "12px" }}>
              <span className="quiz-eyebrow">Skill Details</span>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedSkill(null)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>{selectedSkill.name}</h2>
            <div className="row" style={{ gap: "6px", marginBottom: "16px" }}>
              <span className="chip" style={{ fontSize: "0.75rem" }}>
                {selectedSkill.domain}
              </span>
              <span className="chip" style={{ fontSize: "0.75rem" }}>
                Level {selectedSkill.difficulty}
              </span>
            </div>

            {/* Status Information */}
            <div
              className="card"
              style={{
                background: "var(--bg-muted)",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              <div className="row between" style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
                <span className="muted">Status:</span>
                <strong
                  className="capitalize"
                  style={{
                    color:
                      skillStates[selectedSkill.id] === "completed"
                        ? "var(--success)"
                        : skillStates[selectedSkill.id] === "in_path"
                        ? "var(--primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  {skillStates[selectedSkill.id]?.replace("_", " ")}
                </strong>
              </div>

              {stepBySkillId[selectedSkill.id] && (
                <div className="row between" style={{ fontSize: "0.85rem" }}>
                  <span className="muted">Proficiency:</span>
                  <strong>{Math.round(stepBySkillId[selectedSkill.id].proficiency)}%</strong>
                </div>
              )}
            </div>

            {/* Prerequisite Info */}
            {selectedSkill.prerequisiteSkillId && (
              <div style={{ fontSize: "0.85rem", marginBottom: "20px" }}>
                <span className="muted">Prerequisite: </span>
                <strong>
                  {skillById[selectedSkill.prerequisiteSkillId]?.name ||
                    `Skill #${selectedSkill.prerequisiteSkillId}`}
                </strong>
                {skillStates[selectedSkill.prerequisiteSkillId] === "completed" ? (
                  <span className="text-success" style={{ marginLeft: "6px" }}>
                    ✓ (Satisfied)
                  </span>
                ) : (
                  <span style={{ color: "#ef4444", marginLeft: "6px" }}>
                    (Not yet mastered)
                  </span>
                )}
              </div>
            )}

            {/* Action: Take Quiz */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => navigate(`/assessment?skillId=${selectedSkill.id}`)}
              >
                <GraduationCap size={16} />
                <span>Take Skill Quiz</span>
              </button>

              <Link
                to="/path"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <BookOpen size={16} />
                <span>View Learning Path</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
