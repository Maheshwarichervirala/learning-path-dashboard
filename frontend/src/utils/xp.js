export function getXpLevel(points = 0) {
  const pts = Math.max(0, points);
  if (pts >= 1500) {
    return {
      level: "Master",
      current: pts,
      min: 1500,
      next: 1500,
      needed: 0,
      pct: 100,
      color: "#8b5cf6",
    };
  }
  if (pts >= 700) {
    return {
      level: "Expert",
      current: pts,
      min: 700,
      next: 1500,
      needed: 1500 - pts,
      pct: Math.min(100, Math.round(((pts - 700) / 800) * 100)),
      color: "#3b82f6",
    };
  }
  if (pts >= 300) {
    return {
      level: "Skilled",
      current: pts,
      min: 300,
      next: 700,
      needed: 700 - pts,
      pct: Math.min(100, Math.round(((pts - 300) / 400) * 100)),
      color: "#10b981",
    };
  }
  if (pts >= 100) {
    return {
      level: "Learner",
      current: pts,
      min: 100,
      next: 300,
      needed: 300 - pts,
      pct: Math.min(100, Math.round(((pts - 100) / 200) * 100)),
      color: "#f59e0b",
    };
  }
  return {
    level: "Novice",
    current: pts,
    min: 0,
    next: 100,
    needed: 100 - pts,
    pct: Math.min(100, Math.round((pts / 100) * 100)),
    color: "#6b7280",
  };
}
