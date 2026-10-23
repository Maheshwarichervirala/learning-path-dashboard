import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Assessment from "./pages/Assessment";
import PathPage from "./pages/PathPage";
import Recommendations from "./pages/Recommendations";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import SkillTree from "./pages/SkillTree";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <>
      <div className="background-canvas" aria-hidden="true">
        <div className="background-shape background-shape-1" />
        <div className="background-shape background-shape-2" />
        <div className="background-shape background-shape-3" />
      </div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/path" element={<PathPage />} />
          <Route path="/skill-tree" element={<SkillTree />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}