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
} from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("skills"); // 'skills' | 'questions' | 'resources'
  const [skills, setSkills] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (isAdmin) {
      loadData();
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
          background: "linear-gradient(135deg, var(--bg-surface), var(--primary-light))",
          borderColor: "var(--primary-border)",
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
            <table className="leaderboard-table" style={{ width: "100%" }}>
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
                    <td>
                      <code>#{s.id}</code>
                    </td>
                    <td>
                      <strong>{s.name}</strong>
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: "0.75rem" }}>
                        {s.domain}
                      </span>
                    </td>
                    <td>Level {s.difficulty}</td>
                    <td>
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
                    <td style={{ textAlign: "right" }}>
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
                          style={{ color: "#ef4444" }}
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
            <table className="leaderboard-table" style={{ width: "100%" }}>
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
                      <td>
                        <code>#{q.id}</code>
                      </td>
                      <td>
                        <span className="chip" style={{ fontSize: "0.75rem" }}>
                          {skillNameById[q.skillId] || `Skill #${q.skillId}`}
                        </span>
                      </td>
                      <td style={{ maxWidth: "340px" }}>{q.questionText}</td>
                      <td>
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
                      <td style={{ textAlign: "right" }}>
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
                            style={{ color: "#ef4444" }}
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
            <table className="leaderboard-table" style={{ width: "100%" }}>
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
                    <td>
                      <code>#{r.id}</code>
                    </td>
                    <td>
                      <strong>{r.title}</strong>
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        {r.source || "Web"} • {r.url}
                      </div>
                    </td>
                    <td>
                      <span className={`chip type-badge badge-${(r.type || "other").toLowerCase()}`}>
                        {r.type}
                      </span>
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: "0.75rem" }}>
                        {skillNameById[r.skillId] || `Skill #${r.skillId}`}
                      </span>
                    </td>
                    <td>★ {r.rating ? r.rating.toFixed(1) : "—"}</td>
                    <td style={{ textAlign: "right" }}>
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
                          style={{ color: "#ef4444" }}
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
