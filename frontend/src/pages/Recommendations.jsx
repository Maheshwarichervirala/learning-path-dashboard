import { useEffect, useState, useMemo, useRef } from "react";
import {
  Video,
  FileText,
  Book,
  Code2,
  Bookmark,
  ExternalLink,
  Check,
  ThumbsUp,
  ThumbsDown,
  Star,
  Sparkles,
  Search,
  X,
  ChevronDown,
  BookmarkCheck,
  Clock,
  CheckCircle2,
  RotateCcw,
  Edit3,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useToast } from "../ToastContext";
import { ResourcesSkeleton } from "../components/Skeleton";

// Private Notes Drawer with Debounced Autosave & Saved Indicator
function ResourceNotesDrawer({ resourceId, onClose }) {
  const [text, setText] = useState("");
  const [saveStatus, setSaveStatus] = useState("loading"); // 'loading' | 'saved' | 'saving' | 'unsaved'
  const toast = useToast();
  const timerRef = useRef(null);
  const initialLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/notes", { params: { resourceId } });
        if (mounted) {
          setText(res.data?.text || "");
          setSaveStatus("saved");
          initialLoadedRef.current = true;
        }
      } catch {
        if (mounted) {
          setSaveStatus("saved");
          initialLoadedRef.current = true;
        }
      }
    })();

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resourceId]);

  function handleChange(val) {
    if (val.length > 2000) return;
    setText(val);
    if (!initialLoadedRef.current) return;

    setSaveStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await api.put("/notes", { resourceId, text: val });
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("unsaved");
        toast.error("Failed to save note: " + errMsg(e));
      }
    }, 500);
  }

  return (
    <div
      className="card resource-notes-drawer"
      style={{
        marginTop: "12px",
        padding: "12px",
        background: "var(--bg-muted)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div className="row between" style={{ marginBottom: "6px", alignItems: "center" }}>
        <div className="row" style={{ gap: "6px", alignItems: "center" }}>
          <Edit3 size={13} className="text-primary" />
          <strong style={{ fontSize: "0.8rem" }}>Personal Notes</strong>
        </div>

        <div className="row" style={{ gap: "8px", alignItems: "center" }}>
          {saveStatus === "saving" && (
            <span style={{ fontSize: "0.72rem", color: "var(--primary)" }}>Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span style={{ fontSize: "0.72rem", color: "var(--success)" }}>✓ Saved</span>
          )}
          {saveStatus === "unsaved" && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Unsaved</span>
          )}

          <button
            type="button"
            className="btn-icon"
            style={{ width: "20px", height: "20px", padding: 0 }}
            onClick={onClose}
            aria-label="Close notes drawer"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <textarea
        rows={3}
        maxLength={2000}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add private notes, key insights, formulas, code snippets... (autosaves)"
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          fontSize: "0.82rem",
          resize: "vertical",
          outline: "none",
        }}
      />

      <div className="row between" style={{ marginTop: "4px", fontSize: "0.7rem", color: "var(--text-muted)" }}>
        <span>Max 2000 characters</span>
        <span>{text.length} / 2000</span>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'SAVED' | 'IN_PROGRESS' | 'COMPLETED'
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("best_rated"); // 'best_rated' | 'title_asc' | 'type'
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [votingId, setVotingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openNotesId, setOpenNotesId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Close status dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest(".status-menu-container")) {
        setOpenMenuId(null);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpenMenuId(null);
    }
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [recRes, allRes, progressRes, feedbackRes] = await Promise.allSettled([
          api.get("/recommendations"),
          api.get("/resources"),
          api.get("/progress/mine"),
          api.get("/feedback"),
        ]);

        if (recRes.status === "fulfilled" && mounted) {
          setItems(recRes.value.data || []);
        } else if (recRes.status === "rejected") {
          toast.error(errMsg(recRes.reason));
        }

        if (allRes.status === "fulfilled" && mounted) {
          setAllResources(allRes.value.data || []);
        }

        if (progressRes.status === "fulfilled" && mounted && Array.isArray(progressRes.value.data)) {
          const pMap = {};
          progressRes.value.data.forEach((p) => {
            pMap[p.resourceId] = p.status;
          });
          setProgressMap(pMap);
        }

        if (feedbackRes.status === "fulfilled" && mounted && Array.isArray(feedbackRes.value.data)) {
          const fMap = {};
          feedbackRes.value.data.forEach((f) => {
            fMap[f.resourceId] = f.value;
          });
          setFeedbackMap(fMap);
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

  async function handleFeedback(resourceId, value) {
    setVotingId(resourceId);
    try {
      await api.post("/feedback", { resourceId, value });
      setFeedbackMap((prev) => ({ ...prev, [resourceId]: value }));

      if (value === 1) {
        toast.success("Marked as helpful!");
      } else {
        toast.info("Feedback recorded. Disliked resources are moved to the bottom.");
        setItems((currentItems) => {
          const withoutDisliked = currentItems.filter((item) => item.id !== resourceId);
          const dislikedItem = currentItems.find((item) => item.id === resourceId);
          return dislikedItem ? [...withoutDisliked, dislikedItem] : currentItems;
        });
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setVotingId(null);
    }
  }

  async function handleSetStatus(resourceId, newStatus) {
    setOpenMenuId(null);
    setStatusUpdatingId(resourceId);
    try {
      await api.post("/progress/status", { resourceId, status: newStatus });
      setProgressMap((prev) => ({ ...prev, [resourceId]: newStatus }));

      if (newStatus === "COMPLETED") {
        toast.success("Marked complete! Points and streak awarded.");
        setItems((list) => list.filter((r) => r.id !== resourceId));
      } else if (newStatus === "SAVED") {
        toast.success("Resource saved to your list!");
      } else if (newStatus === "IN_PROGRESS") {
        toast.info("Resource marked as in progress!");
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  const getTypeIcon = (type = "") => {
    switch (type.toLowerCase()) {
      case "video":
        return <Video size={14} className="type-icon video" />;
      case "article":
        return <FileText size={14} className="type-icon article" />;
      case "book":
        return <Book size={14} className="type-icon book" />;
      case "project":
        return <Code2 size={14} className="type-icon project" />;
      default:
        return <Bookmark size={14} className="type-icon" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SAVED":
        return <BookmarkCheck size={14} className="status-icon" />;
      case "IN_PROGRESS":
        return <Clock size={14} className="status-icon" />;
      case "COMPLETED":
        return <CheckCircle2 size={14} className="status-icon" />;
      default:
        return <Bookmark size={14} className="status-icon" />;
    }
  };

  const statusTabs = [
    { key: "all", label: "Recommended" },
    { key: "SAVED", label: "Saved" },
    { key: "IN_PROGRESS", label: "In progress" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const typeFilterOptions = ["all", "video", "article", "book", "project"];

  // Base pool selection based on active tab
  const tabBaseItems = useMemo(() => {
    const catalog = allResources.length > 0 ? allResources : items;

    if (activeTab === "all") {
      // Recommendations: keep saved and in-progress, exclude completed
      return items.filter((r) => progressMap[r.id] !== "COMPLETED");
    }
    if (activeTab === "SAVED") {
      return catalog.filter((r) => progressMap[r.id] === "SAVED");
    }
    if (activeTab === "IN_PROGRESS") {
      return catalog.filter((r) => progressMap[r.id] === "IN_PROGRESS");
    }
    if (activeTab === "COMPLETED") {
      return catalog.filter((r) => progressMap[r.id] === "COMPLETED");
    }
    return items;
  }, [activeTab, items, allResources, progressMap]);

  // Combined filtering: Tab + Type filter chip + Search query + Sorting
  const filteredAndSortedItems = useMemo(() => {
    let result = tabBaseItems;

    // Filter by type chip
    if (activeTypeFilter !== "all") {
      result = result.filter(
        (item) => (item.type || "").toLowerCase() === activeTypeFilter.toLowerCase()
      );
    }

    // Debounced search query across title and tags
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter((item) => {
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const tagsMatch = (item.tags || "").toLowerCase().includes(q);
        return titleMatch || tagsMatch;
      });
    }

    // Sorting
    return [...result].sort((a, b) => {
      const aDisliked = feedbackMap[a.id] === -1 ? 1 : 0;
      const bDisliked = feedbackMap[b.id] === -1 ? 1 : 0;
      if (aDisliked !== bDisliked) return aDisliked - bDisliked;

      if (sortBy === "best_rated") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "title_asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "type") {
        return (
          (a.type || "").localeCompare(b.type || "") ||
          (a.title || "").localeCompare(b.title || "")
        );
      }
      return 0;
    });
  }, [tabBaseItems, activeTypeFilter, debouncedSearch, sortBy, feedbackMap]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const catalog = allResources.length > 0 ? allResources : items;
    return {
      all: items.filter((r) => progressMap[r.id] !== "COMPLETED").length,
      SAVED: catalog.filter((r) => progressMap[r.id] === "SAVED").length,
      IN_PROGRESS: catalog.filter((r) => progressMap[r.id] === "IN_PROGRESS").length,
      COMPLETED: catalog.filter((r) => progressMap[r.id] === "COMPLETED").length,
    };
  }, [items, allResources, progressMap]);

  function resetAllFilters() {
    setSearch("");
    setActiveTypeFilter("all");
    setSortBy("best_rated");
    setActiveTab("all");
  }

  if (loading) return <ResourcesSkeleton />;

  return (
    <div className="resources-page">
      <div className="page-header">
        <h1>Learning Resources</h1>
        <p className="page-subtitle">
          Curated courses, articles, books, and hands-on projects for your current path
        </p>
      </div>

      {/* Status Tabs: Recommended / Saved / In progress / Completed */}
      <div
        className="resource-tabs-bar"
        role="tablist"
        aria-label="Filter resources by learning status"
      >
        {statusTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            className={`resource-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.key === "SAVED" && <BookmarkCheck size={15} />}
            {t.key === "IN_PROGRESS" && <Clock size={15} />}
            {t.key === "COMPLETED" && <CheckCircle2 size={15} />}
            {t.key === "all" && <Sparkles size={15} />}
            <span>{t.label}</span>
            <span className="resource-tab-count">{tabCounts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Controls Bar: Debounced Search & Sort Dropdown */}
      <div className="resources-controls">
        <div className="resources-search-box">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            role="searchbox"
            aria-label="Search resources by title or tags"
            placeholder="Search by title or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              aria-label="Clear search text"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="sort-dropdown-wrapper">
          <label htmlFor="resource-sort-select" className="sort-label">
            Sort by:
          </label>
          <select
            id="resource-sort-select"
            className="sort-select"
            aria-label="Sort resources"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="best_rated">Best rated</option>
            <option value="title_asc">Title A-Z</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Filter Chips by Type */}
      <div
        className="filter-chips-bar"
        role="tablist"
        aria-label="Filter resources by format"
      >
        {typeFilterOptions.map((opt) => {
          const count =
            opt === "all"
              ? tabBaseItems.length
              : tabBaseItems.filter(
                  (i) => (i.type || "").toLowerCase() === opt.toLowerCase()
                ).length;

          return (
            <button
              key={opt}
              type="button"
              role="tab"
              aria-selected={activeTypeFilter === opt}
              className={`filter-chip ${activeTypeFilter === opt ? "active" : ""}`}
              onClick={() => setActiveTypeFilter(opt)}
            >
              {opt !== "all" && getTypeIcon(opt)}
              <span className="capitalize">{opt}</span>
              <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State or Cards Grid */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="card empty-state-card text-center" role="status">
          <Sparkles size={40} className="empty-state-icon" aria-hidden="true" />
          <h2>No Resources Matching Filters</h2>
          <p className="muted max-w-md mx-auto">
            {search.trim()
              ? `No resources matching "${search}". Try searching for another keyword or tag.`
              : activeTab !== "all"
              ? `You don't have any resources in "${statusTabs.find((t) => t.key === activeTab)?.label}" yet.`
              : "No resources found for the current format filter."}
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-secondary row-btn"
              onClick={resetAllFilters}
            >
              <RotateCcw size={15} />
              <span>Reset all filters</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="resources-grid">
          {filteredAndSortedItems.map((r) => {
            const currentFeedback = feedbackMap[r.id];
            const isLiked = currentFeedback === 1;
            const isDisliked = currentFeedback === -1;
            const currentStatus = progressMap[r.id] || null;
            const isMenuOpen = openMenuId === r.id;
            const isNotesOpen = openNotesId === r.id;

            return (
              <div
                key={r.id}
                className={`card resource-card ${isDisliked ? "resource-disliked" : ""}`}
              >
                <div className="resource-card-top row between">
                  <span className={`chip type-badge badge-${(r.type || "other").toLowerCase()}`}>
                    {getTypeIcon(r.type)}
                    <span className="type-label">{r.type}</span>
                  </span>

                  {/* Status Menu Dropdown */}
                  <div className="status-menu-container">
                    <button
                      type="button"
                      className={`status-menu-btn ${
                        currentStatus ? `status-${currentStatus.toLowerCase()}` : ""
                      }`}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                      aria-label={`Status for ${r.title}: ${currentStatus || "None"}. Click to change.`}
                      onClick={() => setOpenMenuId(isMenuOpen ? null : r.id)}
                    >
                      {getStatusIcon(currentStatus)}
                      <span>
                        {currentStatus === "SAVED"
                          ? "Saved"
                          : currentStatus === "IN_PROGRESS"
                          ? "In progress"
                          : currentStatus === "COMPLETED"
                          ? "Completed"
                          : "Status"}
                      </span>
                      <ChevronDown size={12} />
                    </button>

                    {isMenuOpen && (
                      <div className="status-dropdown" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className={`status-menu-item ${currentStatus === "SAVED" ? "active" : ""}`}
                          onClick={() => handleSetStatus(r.id, "SAVED")}
                        >
                          <span className="status-item-label">
                            <BookmarkCheck size={14} />
                            <span>Saved</span>
                          </span>
                          {currentStatus === "SAVED" && <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className={`status-menu-item ${currentStatus === "IN_PROGRESS" ? "active" : ""}`}
                          onClick={() => handleSetStatus(r.id, "IN_PROGRESS")}
                        >
                          <span className="status-item-label">
                            <Clock size={14} />
                            <span>In progress</span>
                          </span>
                          {currentStatus === "IN_PROGRESS" && <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className={`status-menu-item ${currentStatus === "COMPLETED" ? "active" : ""}`}
                          onClick={() => handleSetStatus(r.id, "COMPLETED")}
                        >
                          <span className="status-item-label">
                            <CheckCircle2 size={14} />
                            <span>Completed</span>
                          </span>
                          {currentStatus === "COMPLETED" && <Check size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Feedback Buttons: Like & Dislike */}
                  <div className="feedback-button-group" role="group" aria-label="Resource feedback">
                    <button
                      type="button"
                      className={`btn-icon feedback-btn ${isLiked ? "active-like" : ""}`}
                      onClick={() => handleFeedback(r.id, 1)}
                      disabled={votingId === r.id}
                      aria-pressed={isLiked}
                      title="Helpful resource"
                      aria-label="Thumbs up helpful resource"
                    >
                      <ThumbsUp size={15} />
                    </button>
                    <button
                      type="button"
                      className={`btn-icon feedback-btn ${isDisliked ? "active-dislike" : ""}`}
                      onClick={() => handleFeedback(r.id, -1)}
                      disabled={votingId === r.id}
                      aria-pressed={isDisliked}
                      title="Not helpful / disliked"
                      aria-label="Thumbs down disliked resource"
                    >
                      <ThumbsDown size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="resource-title" title={r.title}>
                  {r.title}
                </h3>

                {r.tags && (
                  <div className="resource-tags-row" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {r.tags.split(",").map((t, ti) => (
                      <span key={ti} className="chip" style={{ fontSize: "0.72rem", padding: "1px 6px" }}>
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="resource-meta">
                  {r.rating != null && (
                    <span className="rating-pill">
                      <Star size={13} className="star-icon" />
                      {r.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="source-name">{r.source || "Web"}</span>
                </div>

                <div className="resource-actions row">
                  <a
                    className="btn btn-secondary btn-sm row-btn"
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Open</span>
                    <ExternalLink size={13} />
                  </a>

                  {/* Notes Drawer Toggle Button */}
                  <button
                    type="button"
                    className={`btn btn-secondary btn-sm row-btn ${isNotesOpen ? "active" : ""}`}
                    onClick={() => setOpenNotesId(isNotesOpen ? null : r.id)}
                    title="Open private notes"
                    aria-label={`Open private notes for ${r.title}`}
                  >
                    <Edit3 size={13} />
                    <span>Notes</span>
                  </button>

                  {currentStatus === "COMPLETED" ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm row-btn"
                      disabled
                      style={{ opacity: 0.8, cursor: "default" }}
                    >
                      <CheckCircle2 size={14} className="text-success" />
                      <span>Completed</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm row-btn"
                      onClick={() => handleSetStatus(r.id, "COMPLETED")}
                      disabled={statusUpdatingId === r.id}
                    >
                      <Check size={14} />
                      <span>{statusUpdatingId === r.id ? "Saving..." : "Mark complete"}</span>
                    </button>
                  )}
                </div>

                {/* Private Notes Drawer */}
                {isNotesOpen && (
                  <ResourceNotesDrawer
                    resourceId={r.id}
                    onClose={() => setOpenNotesId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}