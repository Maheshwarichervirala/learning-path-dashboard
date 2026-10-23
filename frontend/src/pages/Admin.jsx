import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  X,
  Check,
  Info,
  BookOpen,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("skills"); // 'skills' | 'questions' | 'resources' | 'metrics'
  const [skills, setSkills] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // ML evaluation & retrain state
  const [mlMetrics, setMlMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  // Search queries per tab
  const [skillSearch, setSkillSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");

  // Modals state
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({ id: "", name: "", domain: "", difficulty: 1, prerequisiteSkillId: "" });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({ skillId: "", questionText: "", options: "", correctIndex: 0 });

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({ title: "", type: "ARTICLE", url: "", skillId: "", source: "", rating: 4.5, tags: "" });

  const [importingSkillId, setImportingSkillId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Close modals on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setSkillModalOpen(false);
        setQuestionModalOpen(false);
        setResourceModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch all admin data
  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, qRes, rRes] = await Promise.all([
        api.get("/admin/skills"),
        api.get("/admin/questions"),
        api.get("/admin/resources"),
      ]);
      setSkills(sRes.data || []);
      setQuestions(qRes.data || []);
      setResources(rRes.data || []);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await api.get("/admin/ml/metrics");
      setMlMetrics(res.data);
    } catch (e) {
      console.warn("Could not load ML metrics", e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleRetrain = async () => {
    if (
      !window.confirm(
        "Retrain the ML model? Evaluation will run automatically and will reject replacement if candidate model macro F1 drops by more than 2 percentage points."
      )
    ) {
      return;
    }
    try {
      setRetraining(true);
      setRetrainResult(null);
      const res = await api.post("/admin/ml/retrain");
      setRetrainResult(res.data);
      if (res.data?.replaced) {
        toast.success(res.data.message || "Model retrained and deployed successfully!");
        loadMetrics();
      } else {
        toast.error(res.data?.reason || "Retraining rejected: performance dropped by > 2 points.");
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadMetrics();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- Skill Handlers ---
  function openCreateSkill() {
    setEditingSkill(null);
    setSkillForm({ id: "", name: "", domain: "Web Development", difficulty: 1, prerequisiteSkillId: "" });
    setSkillModalOpen(true);
  }

  function openEditSkill(s) {
    setEditingSkill(s);
    setSkillForm({
      id: s.id,
      name: s.name,
      domain: s.domain,
      difficulty: s.difficulty,
      prerequisiteSkillId: s.prerequisiteSkillId || "",
    });
    setSkillModalOpen(true);
  }

  async function handleSaveSkill(e) {
    e.preventDefault();
    try {
      const payload = {
        name: skillForm.name.trim(),
        domain: skillForm.domain.trim(),
        difficulty: Number(skillForm.difficulty),
        prerequisiteSkillId: skillForm.prerequisiteSkillId ? Number(skillForm.prerequisiteSkillId) : null,
      };

      if (editingSkill) {
        await api.put(`/admin/skills/${editingSkill.id}`, payload);
        toast.success(`Skill "${payload.name}" updated successfully`);
      } else {
        if (skillForm.id) payload.id = Number(skillForm.id);
        await api.post("/admin/skills", payload);
        toast.success(`Skill "${payload.name}" created successfully`);
      }
      setSkillModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function handleDeleteSkill(id, name) {
    if (!window.confirm(`Are you sure you want to delete skill "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/skills/${id}`);
      toast.success(`Skill "${name}" deleted`);
      loadData();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImportExternal(skillId, skillName) {
    setImportingSkillId(skillId);
    try {
      const res = await api.post(`/admin/resources/import/${skillId}`);
      const added = res.data?.added || 0;
      toast.success(`Imported ${added} new resources for "${skillName}"!`);
      loadData();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setImportingSkillId(null);
    }
  }

  // --- Question Handlers ---
  function openCreateQuestion() {
    setEditingQuestion(null);
    setQuestionForm({
      skillId: skills[0]?.id || "",
      questionText: "",
      options: "Option A|Option B|Option C|Option D",
      correctIndex: 0,
    });
    setQuestionModalOpen(true);
  }

  function openEditQuestion(q) {
    setEditingQuestion(q);
    setQuestionForm({
      skillId: q.skillId,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
    });
    setQuestionModalOpen(true);
  }

  async function handleSaveQuestion(e) {
    e.preventDefault();
    try {
      const payload = {
        skillId: Number(questionForm.skillId),
        questionText: questionForm.questionText.trim(),
        options: questionForm.options.trim(),
        correctIndex: Number(questionForm.correctIndex),
      };

      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion.id}`, payload);
        toast.success("Question updated successfully");
      } else {
        await api.post("/admin/questions", payload);
        toast.success("Question created successfully");
      }
      setQuestionModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function handleDeleteQuestion(id) {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      toast.success("Question deleted");
      loadData();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  // --- Resource Handlers ---
  function openCreateResource() {
    setEditingResource(null);
    setResourceForm({
      title: "",
      type: "ARTICLE",
      url: "",
      skillId: skills[0]?.id || "",
      source: "Web",
      rating: 4.5,
      tags: "",
    });
    setResourceModalOpen(true);
  }

  function openEditResource(r) {
    setEditingResource(r);
    setResourceForm({
      title: r.title,
      type: r.type,
      url: r.url,
      skillId: r.skillId,
      source: r.source || "Web",
      rating: r.rating || 4.5,
      tags: r.tags || "",
    });
    setResourceModalOpen(true);
  }

  async function handleSaveResource(e) {
    e.preventDefault();
    try {
      const payload = {
        title: resourceForm.title.trim(),
        type: resourceForm.type.trim().toUpperCase(),
        url: resourceForm.url.trim(),
        skillId: Number(resourceForm.skillId),
        source: resourceForm.source ? resourceForm.source.trim() : "Web",
        rating: Number(resourceForm.rating),
        tags: resourceForm.tags.trim(),
      };

      if (editingResource) {
        await api.put(`/admin/resources/${editingResource.id}`, payload);
        toast.success(`Resource "${payload.title}" updated`);
      } else {
        await api.post("/admin/resources", payload);
        toast.success(`Resource "${payload.title}" created`);
      }
      setResourceModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function handleDeleteResource(id, title) {
    if (!window.confirm(`Delete resource "${title}"?`)) return;
    try {
      await api.delete(`/admin/resources/${id}`);
      toast.success(`Resource deleted`);
      loadData();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  // Filtered lists
  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return skills;
    const q = skillSearch.toLowerCase().trim();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        String(s.id).includes(q)
    );
  }, [skills, skillSearch]);

  const filteredQuestions = useMemo(() => {
    if (!questionSearch.trim()) return questions;
    const q = questionSearch.toLowerCase().trim();
    return questions.filter(
      (qt) =>
        qt.questionText.toLowerCase().includes(q) ||
        String(qt.skillId).includes(q) ||
        qt.options.toLowerCase().includes(q)
    );
  }, [questions, questionSearch]);

  const filteredResources = useMemo(() => {
    if (!resourceSearch.trim()) return resources;
    const q = resourceSearch.toLowerCase().trim();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.tags || "").toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.source || "").toLowerCase().includes(q)
    );
  }, [resources, resourceSearch]);

  const skillNameById = useMemo(() => {
    const map = {};
    skills.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [skills]);

  return (
    <div className="admin-page">
      <div className="page-header row between wrap">
        <div>
          <div className="row" style={{ gap: "8px", alignItems: "center" }}>
            <ShieldCheck size={28} className="text-primary" />
            <h1>Admin Console</h1>
          </div>
          <p className="page-subtitle">
            Curriculum content management with automated integrity and delete protection
          </p>
        </div>
      </div>

      {/* Promotion SQL Callout */}
      <div
        className="card"
        style={{
          background: "var(--glass-default)",
          borderColor: "var(--border)",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div className="row" style={{ gap: "10px", alignItems: "flex-start" }}>
          <Info size={20} className="text-primary" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", marginBottom: "4px" }}>
              Administrator Promotion Instructions
            </strong>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              To promote any user to Administrator, execute this SQL query in your database:
            </span>
            <code
              style={{
                display: "block",
                marginTop: "6px",
                padding: "6px 12px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                fontSize: "0.82rem",
                color: "var(--primary)",
                fontFamily: "monospace",
              }}
            >
              UPDATE users SET role='ADMIN' WHERE email='...';
            </code>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="resource-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "skills"}
          className={`resource-tab ${activeTab === "skills" ? "active" : ""}`}
          onClick={() => setActiveTab("skills")}
        >
          <Layers size={16} />
          <span>Skills</span>
          <span className="resource-tab-count">{skills.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "questions"}
          className={`resource-tab ${activeTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveTab("questions")}
        >
          <HelpCircle size={16} />
          <span>Questions</span>
          <span className="resource-tab-count">{questions.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "resources"}
          className={`resource-tab ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => setActiveTab("resources")}
        >
          <BookOpen size={16} />
          <span>Resources</span>
          <span className="resource-tab-count">{resources.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "metrics"}
          className={`resource-tab ${activeTab === "metrics" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("metrics");
            if (!mlMetrics) loadMetrics();
          }}
        >
          <Cpu size={16} />
          <span>Model Metrics</span>
        </button>
      </div>

      {/* --- TAB 1: SKILLS --- */}
      {activeTab === "skills" && (
        <div className="admin-tab-content">
          <div className="resources-controls">
            <div className="resources-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder="Search skills by name, domain, ID..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
              />
            </div>

            <button type="button" className="btn btn-primary row-btn" onClick={openCreateSkill}>
              <Plus size={16} />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Domain</th>
                  <th>Difficulty</th>
                  <th>Prerequisite</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map((s) => (
                  <tr key={s.id}>
                    <td data-label="ID">
                      <code>#{s.id}</code>
                    </td>
                    <td data-label="Name">
                      <strong>{s.name}</strong>
                    </td>
                    <td data-label="Domain">
                      <span className="chip" style={{ fontSize: "0.75rem" }}>
                        {s.domain}
                      </span>
                    </td>
                    <td data-label="Difficulty">Level {s.difficulty}</td>
                    <td data-label="Prerequisite">
                      {s.prerequisiteSkillId ? (
                        <span className="muted" style={{ fontSize: "0.82rem" }}>
                          #{s.prerequisiteSkillId} ({skillNameById[s.prerequisiteSkillId] || "Skill"})
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: "0.82rem" }}>
                          None (Root)
                        </span>
                      )}
                    </td>
                    <td data-label="Actions" style={{ textAlign: "right" }}>
                      <div className="row" style={{ justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Import YouTube & GitHub external resources"
                          onClick={() => handleImportExternal(s.id, s.name)}
                          disabled={importingSkillId === s.id}
                        >
                          <Download size={13} />
                          <span>{importingSkillId === s.id ? "Importing..." : "Import Web"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditSkill(s)}
                          title="Edit skill"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--danger)" }}
                          onClick={() => handleDeleteSkill(s.id, s.name)}
                          disabled={deletingId === s.id}
                          title="Delete skill"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: QUESTIONS --- */}
      {activeTab === "questions" && (
        <div className="admin-tab-content">
          <div className="resources-controls">
            <div className="resources-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder="Search questions by text or skill..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
              />
            </div>

            <button type="button" className="btn btn-primary row-btn" onClick={openCreateQuestion}>
              <Plus size={16} />
              <span>Add Question</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Skill</th>
                  <th>Question Text</th>
                  <th>Options</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => {
                  const opts = q.options.split("|");
                  return (
                    <tr key={q.id}>
                      <td data-label="ID">
                        <code>#{q.id}</code>
                      </td>
                      <td data-label="Skill">
                        <span className="chip" style={{ fontSize: "0.75rem" }}>
                          {skillNameById[q.skillId] || `Skill #${q.skillId}`}
                        </span>
                      </td>
                      <td data-label="Question" style={{ maxWidth: "340px" }}>{q.questionText}</td>
                      <td data-label="Options">
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {opts.map((opt, oi) => (
                            <span
                              key={oi}
                              className={`chip ${oi === q.correctIndex ? "chip-completed" : ""}`}
                              style={{ fontSize: "0.72rem" }}
                            >
                              {opt} {oi === q.correctIndex && "✓"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td data-label="Actions" style={{ textAlign: "right" }}>
                        <div className="row" style={{ justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditQuestion(q)}
                            title="Edit question"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--danger)" }}
                            onClick={() => handleDeleteQuestion(q.id)}
                            title="Delete question"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: RESOURCES --- */}
      {activeTab === "resources" && (
        <div className="admin-tab-content">
          <div className="resources-controls">
            <div className="resources-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder="Search resources by title, type, source..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
              />
            </div>

            <button type="button" className="btn btn-primary row-btn" onClick={openCreateResource}>
              <Plus size={16} />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Skill</th>
                  <th>Rating</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((r) => (
                  <tr key={r.id}>
                    <td data-label="ID">
                      <code>#{r.id}</code>
                    </td>
                    <td data-label="Title">
                      <strong>{r.title}</strong>
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        {r.source || "Web"} • {r.url}
                      </div>
                    </td>
                    <td data-label="Type">
                      <span className={`chip type-badge badge-${(r.type || "other").toLowerCase()}`}>
                        {r.type}
                      </span>
                    </td>
                    <td data-label="Skill">
                      <span className="chip" style={{ fontSize: "0.75rem" }}>
                        {skillNameById[r.skillId] || `Skill #${r.skillId}`}
                      </span>
                    </td>
                    <td data-label="Rating">★ {r.rating ? r.rating.toFixed(1) : "—"}</td>
                    <td data-label="Actions" style={{ textAlign: "right" }}>
                      <div className="row" style={{ justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditResource(r)}
                          title="Edit resource"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--danger)" }}
                          onClick={() => handleDeleteResource(r.id, r.title)}
                          title="Delete resource"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: MODEL METRICS --- */}
      {activeTab === "metrics" && (
        <div className="admin-tab-content">
          <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
            <div className="row between wrap" style={{ gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <div>
                <div className="row" style={{ gap: "10px", alignItems: "center" }}>
                  <Cpu size={24} className="text-primary" />
                  <h2 style={{ margin: 0 }}>Model Evaluation Metrics</h2>
                  <span className="chip chip-completed" style={{ fontSize: "0.75rem" }}>
                    Live Model
                  </span>
                </div>
                <p className="muted" style={{ margin: "4px 0 0 0", fontSize: "0.85rem" }}>
                  Stratified 80/20 train/test evaluation, 5-fold cross validation, and baseline comparisons.
                  {mlMetrics?.evaluation_timestamp && (
                    <span> • Evaluated {new Date(mlMetrics.evaluation_timestamp).toLocaleString()}</span>
                  )}
                </p>
              </div>

              <div className="row" style={{ gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={loadMetrics}
                  disabled={loadingMetrics}
                  title="Refresh latest metrics from service"
                >
                  <RefreshCw size={14} className={loadingMetrics ? "spin" : ""} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRetrain}
                  disabled={retraining}
                  title="Retrain model with evaluation guardrail"
                >
                  <Sparkles size={14} className={retraining ? "spin" : ""} />
                  <span>{retraining ? "Evaluating & Training..." : "Retrain Model"}</span>
                </button>
              </div>
            </div>

            {/* Retrain Result Alert */}
            {retrainResult && (
              <div
                className="card"
                style={{
                  padding: "12px 16px",
                  marginBottom: "20px",
                  borderColor: retrainResult.replaced ? "var(--success)" : "var(--danger)",
                  background: "var(--bg-surface)",
                }}
              >
                <div className="row" style={{ gap: "10px", alignItems: "center" }}>
                  {retrainResult.replaced ? (
                    <Check size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: "var(--danger)", flexShrink: 0 }} />
                  )}
                  <div>
                    <strong style={{ color: retrainResult.replaced ? "var(--success)" : "var(--danger)", fontSize: "0.9rem" }}>
                      {retrainResult.replaced ? "Retrain Accepted & Live Model Replaced" : "Retrain Rejected by Guardrail"}
                    </strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {retrainResult.message || retrainResult.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer & Leakage Callout */}
            <div
              className="card"
              style={{
                background: "var(--glass-default)",
                borderColor: "var(--border)",
                padding: "14px 18px",
                marginBottom: "24px",
              }}
            >
              <div className="row" style={{ gap: "10px", alignItems: "flex-start" }}>
                <AlertTriangle size={18} className="text-primary" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div className="row" style={{ gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.88rem" }}>Synthetic Data & Label Leakage Disclosure</strong>
                    <span className="chip" style={{ fontSize: "0.7rem", color: "var(--primary)" }}>
                      Synthetic: 100%
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {mlMetrics?.level_classifier?.leakage_assessment ||
                      "Dataset is 100% synthetically generated (3,000 samples). Labels were synthesized from avg_score with Gaussian noise, producing high correlation. Do not trust these metrics for production decisions until real learner logs are accumulated."}
                  </p>
                </div>
              </div>
            </div>

            {loadingMetrics && !mlMetrics ? (
              <div style={{ textAlign: "center", padding: "40px" }} className="muted">
                Loading ML evaluation metrics...
              </div>
            ) : mlMetrics?.level_classifier ? (
              <>
                {/* 4 Cards Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {/* Card 1: Random Forest Classifier */}
                  <div className="card" style={{ padding: "18px", background: "var(--bg-surface)" }}>
                    <span className="muted" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Classifier Performance
                    </span>
                    <h3 style={{ margin: "6px 0 12px 0", fontSize: "1.1rem" }}>Random Forest (Live)</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                      <div className="row between">
                        <span className="muted">Accuracy (80/20 test):</span>
                        <strong>{((mlMetrics.level_classifier.random_forest?.accuracy || 0) * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="row between">
                        <span className="muted">Macro F1:</span>
                        <strong>{((mlMetrics.level_classifier.random_forest?.macro_f1 || 0) * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="row between">
                        <span className="muted">Macro Precision:</span>
                        <span>{((mlMetrics.level_classifier.random_forest?.macro_precision || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="row between">
                        <span className="muted">Macro Recall:</span>
                        <span>{((mlMetrics.level_classifier.random_forest?.macro_recall || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="row between" style={{ borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                        <span className="muted">5-Fold Stratified CV:</span>
                        <strong style={{ color: "var(--primary)" }}>
                          {((mlMetrics.level_classifier.cross_validation_5fold?.cv_accuracy_mean || 0) * 100).toFixed(1)}% ±
                          {" "}{((mlMetrics.level_classifier.cross_validation_5fold?.cv_accuracy_std || 0) * 100).toFixed(2)}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Baseline Comparison */}
                  <div className="card" style={{ padding: "18px", background: "var(--bg-surface)" }}>
                    <span className="muted" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Benchmark Baselines
                    </span>
                    <h3 style={{ margin: "6px 0 12px 0", fontSize: "1.1rem" }}>Baseline Models</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
                      <div style={{ padding: "8px 10px", background: "var(--glass-default)", borderRadius: "var(--radius-sm)" }}>
                        <div className="row between">
                          <strong>Majority Class Baseline</strong>
                          <span>{((mlMetrics.level_classifier.majority_class_baseline?.accuracy || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <span className="muted" style={{ fontSize: "0.75rem" }}>
                          Macro F1: {((mlMetrics.level_classifier.majority_class_baseline?.macro_f1 || 0) * 100).toFixed(1)}% (Always predicts Beginner)
                        </span>
                      </div>

                      <div style={{ padding: "8px 10px", background: "var(--glass-default)", borderRadius: "var(--radius-sm)" }}>
                        <div className="row between">
                          <strong>Simple Rule-Based Predictor</strong>
                          <span>{((mlMetrics.level_classifier.rule_based_baseline?.accuracy || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <span className="muted" style={{ fontSize: "0.75rem" }}>
                          Macro F1: {((mlMetrics.level_classifier.rule_based_baseline?.macro_f1 || 0) * 100).toFixed(1)}% (Threshold: &lt;40, &lt;75, &ge;75)
                        </span>
                      </div>

                      <div className="row between" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <span>RF Lift vs Majority:</span>
                        <strong style={{ color: "var(--success)" }}>
                          +{(((mlMetrics.level_classifier.random_forest?.accuracy || 0) - (mlMetrics.level_classifier.majority_class_baseline?.accuracy || 0)) * 100).toFixed(1)}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Recommender Evaluation */}
                  <div className="card" style={{ padding: "18px", background: "var(--bg-surface)" }}>
                    <span className="muted" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Recommendation Quality
                    </span>
                    <h3 style={{ margin: "6px 0 12px 0", fontSize: "1.1rem" }}>Recommender (Top-5)</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                      <div className="row between">
                        <span className="muted">Precision@5:</span>
                        <strong style={{ color: "var(--primary)" }}>
                          {((mlMetrics.recommender?.precision_at_5 || 0) * 100).toFixed(1)}%
                        </strong>
                      </div>
                      <div className="row between">
                        <span className="muted">Recall@5:</span>
                        <strong>{((mlMetrics.recommender?.recall_at_5 || 0) * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="row between">
                        <span className="muted">NDCG@5:</span>
                        <strong>{((mlMetrics.recommender?.ndcg_at_5 || 0) * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="row between" style={{ borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                        <span className="muted">Evaluation Profiles:</span>
                        <span>{mlMetrics.recommender?.num_users_evaluated || 0} synthetic users</span>
                      </div>
                      <span className="muted" style={{ fontSize: "0.75rem", fontStyle: "italic" }}>
                        Offline ranking across 28 items
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Class Imbalance & Feature Correlations */}
                  <div className="card" style={{ padding: "18px", background: "var(--bg-surface)" }}>
                    <span className="muted" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Dataset Distributions
                    </span>
                    <h3 style={{ margin: "6px 0 12px 0", fontSize: "1.1rem" }}>Classes & Correlations</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem" }}>
                      <div className="row between">
                        <span>Beginner:</span>
                        <span className="chip" style={{ fontSize: "0.72rem" }}>
                          {mlMetrics.level_classifier.class_imbalance?.Beginner?.count} ({mlMetrics.level_classifier.class_imbalance?.Beginner?.percentage}%)
                        </span>
                      </div>
                      <div className="row between">
                        <span>Intermediate:</span>
                        <span className="chip" style={{ fontSize: "0.72rem" }}>
                          {mlMetrics.level_classifier.class_imbalance?.Intermediate?.count} ({mlMetrics.level_classifier.class_imbalance?.Intermediate?.percentage}%)
                        </span>
                      </div>
                      <div className="row between">
                        <span>Advanced:</span>
                        <span className="chip" style={{ fontSize: "0.72rem" }}>
                          {mlMetrics.level_classifier.class_imbalance?.Advanced?.count} ({mlMetrics.level_classifier.class_imbalance?.Advanced?.percentage}%)
                        </span>
                      </div>
                      <div style={{ borderTop: "1px solid var(--border)", marginTop: "4px", paddingTop: "4px" }}>
                        <span className="muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "2px" }}>
                          Target Correlations (Leakage indicator):
                        </span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "0.75rem" }}>
                          <span>avg: <strong>{mlMetrics.level_classifier.feature_correlations_with_target?.avg_score}</strong></span>
                          <span>last: <strong>{mlMetrics.level_classifier.feature_correlations_with_target?.last_score}</strong></span>
                          <span>quizzes: <strong>{mlMetrics.level_classifier.feature_correlations_with_target?.quizzes_taken}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confusion Matrix Section */}
                <div className="card" style={{ padding: "20px", background: "var(--bg-surface)" }}>
                  <h3 style={{ margin: "0 0 14px 0", fontSize: "1rem" }}>
                    Confusion Matrix (Test Set: {mlMetrics.level_classifier.sample_size * 0.2} samples)
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table className="admin-table" style={{ textAlign: "center" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }}>Actual \ Predicted</th>
                          {mlMetrics.level_classifier.confusion_matrix?.labels?.map((label) => (
                            <th key={label} style={{ textAlign: "center" }}>
                              Pred {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mlMetrics.level_classifier.confusion_matrix?.matrix?.map((row, rIdx) => {
                          const actualLabel = mlMetrics.level_classifier.confusion_matrix.labels[rIdx];
                          return (
                            <tr key={rIdx}>
                              <td style={{ textAlign: "left", fontWeight: "bold" }}>True {actualLabel}</td>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx}>
                                  <span
                                    className={`chip ${rIdx === cIdx ? "chip-completed" : ""}`}
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: rIdx === cIdx ? "bold" : "normal",
                                    }}
                                  >
                                    {cell}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="card" style={{ padding: "20px", textAlign: "center" }}>
                <p className="muted">ML Service metrics currently unavailable.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={loadMetrics}>
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* --- SKILL MODAL --- */}
      {skillModalOpen && (
        <div className="modal-overlay" onClick={() => setSkillModalOpen(false)}>
          <div className="card modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row between" style={{ marginBottom: "16px" }}>
              <h2>{editingSkill ? "Edit Skill" : "Create New Skill"}</h2>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSkillModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSkill} className="auth-form">
              {!editingSkill && (
                <div className="form-group">
                  <label htmlFor="skill-id-input">Skill ID (optional manual ID)</label>
                  <input
                    id="skill-id-input"
                    type="number"
                    placeholder="Auto-assigned if left blank"
                    value={skillForm.id}
                    onChange={(e) => setSkillForm({ ...skillForm, id: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="skill-name-input">Skill Name *</label>
                <input
                  id="skill-name-input"
                  type="text"
                  required
                  placeholder="e.g. TypeScript Fundamentals"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="skill-domain-input">Domain *</label>
                <input
                  id="skill-domain-input"
                  type="text"
                  required
                  placeholder="e.g. Web Development, Data Science"
                  value={skillForm.domain}
                  onChange={(e) => setSkillForm({ ...skillForm, domain: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="skill-diff-select">Difficulty Level (1 - 5) *</label>
                <select
                  id="skill-diff-select"
                  className="sort-select"
                  value={skillForm.difficulty}
                  onChange={(e) => setSkillForm({ ...skillForm, difficulty: Number(e.target.value) })}
                >
                  <option value={1}>1 - Beginner</option>
                  <option value={2}>2 - Intermediate</option>
                  <option value={3}>3 - Advanced</option>
                  <option value={4}>4 - Expert</option>
                  <option value={5}>5 - Master</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="skill-pre-select">Prerequisite Skill (cycle-checked)</label>
                <select
                  id="skill-pre-select"
                  className="sort-select"
                  value={skillForm.prerequisiteSkillId}
                  onChange={(e) => setSkillForm({ ...skillForm, prerequisiteSkillId: e.target.value })}
                >
                  <option value="">None (Root Skill)</option>
                  {skills
                    .filter((s) => !editingSkill || s.id !== editingSkill.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} {s.name} ({s.domain})
                      </option>
                    ))}
                </select>
              </div>

              <div className="row" style={{ justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSkillModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSkill ? "Update Skill" : "Create Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUESTION MODAL --- */}
      {questionModalOpen && (
        <div className="modal-overlay" onClick={() => setQuestionModalOpen(false)}>
          <div className="card modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row between" style={{ marginBottom: "16px" }}>
              <h2>{editingQuestion ? "Edit Question" : "Create New Question"}</h2>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setQuestionModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="auth-form">
              <div className="form-group">
                <label htmlFor="q-skill-select">Skill *</label>
                <select
                  id="q-skill-select"
                  className="sort-select"
                  required
                  value={questionForm.skillId}
                  onChange={(e) => setQuestionForm({ ...questionForm, skillId: e.target.value })}
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} {s.name} ({s.domain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="q-text-input">Question Text *</label>
                <textarea
                  id="q-text-input"
                  required
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
                  placeholder="What does HTTP status code 404 signify?"
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="q-options-input">Options (separated by |) *</label>
                <input
                  id="q-options-input"
                  type="text"
                  required
                  placeholder="Option A|Option B|Option C|Option D"
                  value={questionForm.options}
                  onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                />
                <span className="muted" style={{ fontSize: "0.75rem", display: "block", marginTop: "4px" }}>
                  Separate each choice with a vertical bar pipe (|).
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="q-correct-select">Correct Option Index *</label>
                <select
                  id="q-correct-select"
                  className="sort-select"
                  value={questionForm.correctIndex}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctIndex: Number(e.target.value) })}
                >
                  {questionForm.options.split("|").map((opt, i) => (
                    <option key={i} value={i}>
                      Index {i}: {opt || `(Option ${i + 1})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row" style={{ justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setQuestionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingQuestion ? "Update Question" : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESOURCE MODAL --- */}
      {resourceModalOpen && (
        <div className="modal-overlay" onClick={() => setResourceModalOpen(false)}>
          <div className="card modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row between" style={{ marginBottom: "16px" }}>
              <h2>{editingResource ? "Edit Resource" : "Create New Resource"}</h2>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setResourceModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="auth-form">
              <div className="form-group">
                <label htmlFor="r-title-input">Title *</label>
                <input
                  id="r-title-input"
                  type="text"
                  required
                  placeholder="e.g. The Pragmatic Programmer"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="r-type-select">Format Type *</label>
                <select
                  id="r-type-select"
                  className="sort-select"
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                >
                  <option value="ARTICLE">ARTICLE</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="BOOK">BOOK</option>
                  <option value="PROJECT">PROJECT</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="r-url-input">Resource URL *</label>
                <input
                  id="r-url-input"
                  type="url"
                  required
                  placeholder="https://..."
                  value={resourceForm.url}
                  onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="r-skill-select">Skill *</label>
                <select
                  id="r-skill-select"
                  className="sort-select"
                  required
                  value={resourceForm.skillId}
                  onChange={(e) => setResourceForm({ ...resourceForm, skillId: e.target.value })}
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} {s.name} ({s.domain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="r-source-input">Source Name</label>
                <input
                  id="r-source-input"
                  type="text"
                  placeholder="e.g. MDN, YouTube, O'Reilly"
                  value={resourceForm.source}
                  onChange={(e) => setResourceForm({ ...resourceForm, source: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="r-rating-input">Rating (1.0 - 5.0)</label>
                <input
                  id="r-rating-input"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={resourceForm.rating}
                  onChange={(e) => setResourceForm({ ...resourceForm, rating: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="r-tags-input">Tags (comma-separated)</label>
                <input
                  id="r-tags-input"
                  type="text"
                  placeholder="e.g. javascript, react, frontend"
                  value={resourceForm.tags}
                  onChange={(e) => setResourceForm({ ...resourceForm, tags: e.target.value })}
                />
              </div>

              <div className="row" style={{ justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResourceModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingResource ? "Update Resource" : "Create Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
