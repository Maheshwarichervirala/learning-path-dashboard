import { useState, useEffect } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Route as RouteIcon,
  GraduationCap,
  BookOpen,
  Trophy,
  User,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Sparkles,
  GitFork,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";
import { getXpLevel } from "../utils/xp";
import api from "../api";

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (user) {
      api
        .get("/dashboard/summary")
        .then((res) => {
          if (mounted && res.data?.points != null) {
            setPoints(res.data.points);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const closeMenu = () => setMobileMenuOpen(false);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/path", label: "My Path", icon: RouteIcon },
    { to: "/skill-tree", label: "Skill Tree", icon: GitFork },
    { to: "/assessment", label: "Assessment", icon: GraduationCap },
    { to: "/recommendations", label: "Resources", icon: BookOpen },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/profile", label: "Profile", icon: User },
  ];

  if (isAdmin) {
    navItems.push({ to: "/admin", label: "Admin Area", icon: ShieldCheck });
  }

  const xpInfo = getXpLevel(points);

  return (
    <div className="app-shell">
      {/* Mobile Topbar */}
      <header className="mobile-header">
        <div className="brand">
          <Sparkles className="brand-icon" size={22} />
          <span>Learning Path</span>
        </div>
        <div className="mobile-actions">
          <button
            type="button"
            className="theme-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            type="button"
            className="menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`} aria-label="Main Navigation">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Sparkles size={22} />
          </div>
          <div className="brand-info">
            <span className="brand-title">Learning Path</span>
            <span className="brand-subtitle">Skill Accelerator</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Icon size={19} className="link-icon" />
                <span className="link-text">{item.label}</span>
                {item.to === "/admin" && <span className="chip" style={{ fontSize: "0.7rem", padding: "1px 6px", marginLeft: "auto" }}>Admin</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle-row"
            onClick={toggleTheme}
            aria-label={`Toggle theme, current is ${theme}`}
          >
            <span className="theme-toggle-icon">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            <span className="theme-toggle-label">
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </span>
          </button>

          {/* User profile & XP widget */}
          <div className="user-profile-widget" style={{ flexDirection: "column", gap: "8px" }}>
            <div className="row between" style={{ width: "100%", alignItems: "center" }}>
              <NavLink to="/profile" onClick={closeMenu} className="user-avatar-link" title="View profile">
                <div className="avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </NavLink>
              <button
                type="button"
                className="logout-icon-btn"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* XP Level Progress Bar */}
            <div className="sidebar-xp-box" style={{ width: "100%", marginTop: "4px" }}>
              <div className="row between" style={{ fontSize: "0.75rem", marginBottom: "4px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Level: <span style={{ color: "var(--primary)" }}>{xpInfo.level}</span>
                </span>
                <span className="muted" style={{ fontSize: "0.72rem" }}>
                  {points} XP
                </span>
              </div>
              <div
                className="xp-progress-track"
                style={{
                  height: "5px",
                  borderRadius: "999px",
                  background: "var(--bg-muted)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="xp-progress-fill"
                  style={{
                    width: `${xpInfo.pct}%`,
                    height: "100%",
                    background: "var(--primary)",
                    borderRadius: "999px",
                    transition: "width 0.3s ease",
                  }}
                  title={`${xpInfo.pct}% to next level`}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-viewport">
        <main className="page-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
