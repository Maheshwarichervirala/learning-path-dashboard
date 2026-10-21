import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  Route as RouteIcon,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  GraduationCap,
  RefreshCw,
  Award,
  Download,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import { PathSkeleton } from "../components/Skeleton";

export default function PathPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    try {
      const res = await api.get("/paths/me");
      setPath(res.data);
    } catch (e) {
      if (e.response?.status !== 404) {
        toast.error(errMsg(e));
      }
      setPath(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await api.post("/paths/generate");
      setPath(res.data);
      toast.success("Learning path generated successfully!");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setGenerating(false);
    }
  }

  const steps = path?.steps || [];
  const completedCount = steps.filter((s) => s.status === "COMPLETED").length;
  const isAllComplete = steps.length > 0 && steps.every((s) => s.status === "COMPLETED");
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  function downloadCertificate() {
    if (!isAllComplete) return;

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const completionDate = new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const certId = `CERT-LP-${path.pathId || 101}-${Date.now().toString(36).toUpperCase()}`;

      // Background tint
      doc.setFillColor(252, 252, 254);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Outer primary indigo border
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Inner gold border
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.8);
      doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

      // Decorative corner accents
      doc.setFillColor(99, 102, 241);
      doc.circle(13, 13, 3, "F");
      doc.circle(pageWidth - 13, 13, 3, "F");
      doc.circle(13, pageHeight - 13, 3, "F");
      doc.circle(pageWidth - 13, pageHeight - 13, 3, "F");

      // Header
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("LEARNING PATH PLATFORM", pageWidth / 2, 28, { align: "center" });

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 42, { align: "center" });

      // Subtitle
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text("This official credential is proudly presented to", pageWidth / 2, 53, {
        align: "center",
      });

      // Recipient Name
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text(user?.name || "Accomplished Learner", pageWidth / 2, 66, { align: "center" });

      // Divider line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 50, 71, pageWidth / 2 + 50, 71);

      // Description with Career Goal
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(
        "for successfully demonstrating verified mastery in all curriculum milestones for:",
        pageWidth / 2,
        80,
        { align: "center" }
      );

      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(path.careerGoal || "Curriculum Roadmap", pageWidth / 2, 90, {
        align: "center",
      });

      // Mastered Skills List
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("VERIFIED SKILLS MASTERED", pageWidth / 2, 103, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const skillsText = steps.map((s) => s.skillName).join("  •  ");
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 60);
      doc.text(splitSkills, pageWidth / 2, 110, { align: "center" });

      // Footer
      const footerY = pageHeight - 26;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8.5);
      doc.text(`Issue Date: ${completionDate}`, 24, footerY);
      doc.text(`Certificate ID: ${certId}`, 24, footerY + 5);

      doc.text("Verified by Automated Evaluation Engine", pageWidth - 24, footerY, {
        align: "right",
      });
      doc.text("Valid Digital Credential", pageWidth - 24, footerY + 5, {
        align: "right",
      });

      doc.save(`Certificate-${(user?.name || "Learner").replace(/\s+/g, "_")}.pdf`);
      toast.success("Certificate generated and downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate certificate: " + err.message);
    }
  }

  if (loading) return <PathSkeleton />;

  return (
    <div className="path-page">
      <div className="page-header row between wrap" style={{ gap: "12px", alignItems: "center" }}>
        <div>
          <h1>My Learning Path</h1>
          <p className="page-subtitle">Personalized sequential roadmap tailored to your skill gaps</p>
        </div>

        <div className="row" style={{ gap: "10px" }}>
          {/* Certificate Download Button */}
          {path && (
            <button
              type="button"
              className={`btn ${isAllComplete ? "btn-primary" : "btn-secondary"} row-btn`}
              onClick={downloadCertificate}
              disabled={!isAllComplete}
              title={
                isAllComplete
                  ? "Download your official certificate of completion"
                  : "Complete all path steps to unlock your certificate"
              }
              aria-label={
                isAllComplete
                  ? "Download certificate"
                  : "Complete all path steps to unlock your certificate"
              }
              style={{
                opacity: isAllComplete ? 1 : 0.65,
                cursor: isAllComplete ? "pointer" : "not-allowed",
              }}
            >
              <Award size={16} />
              <span>Download certificate</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary row-btn"
            onClick={generate}
            disabled={generating}
          >
            <RefreshCw size={16} className={generating ? "spin-icon" : ""} />
            <span>{generating ? "Generating..." : "Regenerate path"}</span>
          </button>
        </div>
      </div>

      {!path && (
        <div className="card empty-state-card text-center">
          <RouteIcon size={48} className="empty-state-icon" />
          <h2>No Learning Path Found</h2>
          <p className="muted max-w-md mx-auto">
            We haven&apos;t built your path yet. Complete your profile and skill quizzes to generate a tailored step-by-step roadmap.
          </p>
          <button type="button" className="btn btn-primary" onClick={generate} disabled={generating}>
            <Sparkles size={16} />
            <span>Generate My Path</span>
          </button>
        </div>
      )}

      {path && (
        <>
          {/* Progress Overview Card */}
          <div className="card path-progress-card">
            <div className="progress-card-top row between wrap" style={{ gap: "12px" }}>
              <div className="goal-info">
                <span className="goal-tag">Career Goal</span>
                <strong className="goal-title">{path.careerGoal || "Software Developer"}</strong>
              </div>
              <div className="progress-stat-pill">
                <strong>{completedCount}</strong> of <strong>{steps.length}</strong> Skills Mastered ({progressPercent}%)
              </div>
            </div>

            <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {steps.length === 0 ? (
            <div className="card celebration-card text-center">
              <Award size={48} className="celebration-icon" />
              <h2>Curriculum Complete!</h2>
              <p className="muted">You have passed every skill in this domain. Excellent work!</p>
            </div>
          ) : (
            <div className="roadmap-container">
              <ol className="roadmap-tree">
                {steps.map((s, idx) => {
                  const isCompleted = s.status === "COMPLETED";
                  const isInProgress = s.status === "IN_PROGRESS";

                  return (
                    <li
                      key={s.skillId}
                      className={`roadmap-step ${s.status.toLowerCase()} ${isCompleted ? "is-complete" : ""}`}
                    >
                      {/* Node Dot / Status Icon */}
                      <div className="step-marker" aria-hidden="true">
                        {isCompleted ? (
                          <CheckCircle2 size={22} className="marker-icon check" />
                        ) : isInProgress ? (
                          <Clock size={20} className="marker-icon in-progress" />
                        ) : (
                          <Circle size={18} className="marker-icon not-started" />
                        )}
                        <span className="step-number">{s.order || idx + 1}</span>
                      </div>

                      {/* Step Card */}
                      <div className="card step-content-card">
                        <div className="step-header row between wrap" style={{ gap: "10px" }}>
                          <div>
                            <h3 className="step-skill-name">{s.skillName}</h3>
                            <div className="step-meta">
                              <span className={`status-chip chip-${s.status.toLowerCase()}`}>
                                {s.status.replace("_", " ")}
                              </span>
                              <span className="proficiency-stat">
                                Proficiency: <strong>{Math.round(s.proficiency)}%</strong>
                              </span>
                            </div>
                          </div>

                          {/* "Take quiz" button on each step that opens that skill's quiz */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm row-btn take-quiz-btn"
                            onClick={() => navigate(`/assessment?skillId=${s.skillId}`)}
                            title={`Take quiz for ${s.skillName}`}
                            aria-label={`Take quiz for ${s.skillName}`}
                          >
                            <GraduationCap size={15} />
                            <span>Take quiz</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}