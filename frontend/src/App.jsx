import { Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Assessment from "./pages/Assessment";
import PathPage from "./pages/PathPage";
import Recommendations from "./pages/Recommendations";
import Dashboard from "./pages/Dashboard";

function Layout() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <header className="nav">
        <strong className="brand">Learning Path</strong>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/assessment">Assessment</NavLink>
          <NavLink to="/path">My Path</NavLink>
          <NavLink to="/recommendations">Resources</NavLink>
        </nav>
        <span className="who">
          {user.name} <button className="link" onClick={logout}>Log out</button>
        </span>
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/path" element={<PathPage />} />
        <Route path="/recommendations" element={<Recommendations />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}