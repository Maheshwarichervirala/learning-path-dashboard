export function Skeleton({ className = "", style = {}, variant = "text", width, height }) {
  const combinedStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };
  return <div className={`skeleton skeleton-${variant} ${className}`} style={combinedStyle} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton variant="text" width="220px" height="32px" style={{ marginBottom: "20px" }} />
      <div className="stats">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card stat-skeleton">
            <Skeleton variant="circle" width="36px" height="36px" style={{ margin: "0 auto 10px" }} />
            <Skeleton variant="text" width="60px" height="32px" style={{ margin: "0 auto 8px" }} />
            <Skeleton variant="text" width="90px" height="14px" style={{ margin: "0 auto" }} />
          </div>
        ))}
      </div>
      <div className="grid charts" style={{ marginTop: "24px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card chart-skeleton">
            <Skeleton variant="text" width="140px" height="20px" style={{ marginBottom: "16px" }} />
            <Skeleton variant="rect" height="220px" />
          </div>
        ))}
      </div>
      <div style={{ marginTop: "32px" }}>
        <Skeleton variant="text" width="120px" height="24px" style={{ marginBottom: "16px" }} />
        <div className="grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card badge-skeleton">
              <Skeleton variant="circle" width="32px" height="32px" style={{ marginBottom: "10px" }} />
              <Skeleton variant="text" width="80%" height="18px" style={{ marginBottom: "8px" }} />
              <Skeleton variant="text" width="100%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PathSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading learning path">
      <div className="row between" style={{ marginBottom: "24px" }}>
        <Skeleton variant="text" width="240px" height="32px" />
        <Skeleton variant="rect" width="160px" height="40px" style={{ borderRadius: "8px" }} />
      </div>
      <div className="card" style={{ marginBottom: "24px" }}>
        <Skeleton variant="text" width="180px" height="18px" style={{ marginBottom: "12px" }} />
        <Skeleton variant="rect" height="12px" style={{ borderRadius: "6px" }} />
      </div>
      <div className="tree-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="node-skeleton" style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <Skeleton variant="circle" width="36px" height="36px" />
            <div style={{ flex: 1 }}>
              <Skeleton variant="text" width="200px" height="20px" style={{ marginBottom: "8px" }} />
              <Skeleton variant="text" width="140px" height="14px" />
            </div>
            <Skeleton variant="rect" width="100px" height="36px" style={{ borderRadius: "8px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourcesSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading resources">
      <Skeleton variant="text" width="260px" height="32px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rect" width="80px" height="34px" style={{ borderRadius: "999px" }} />
        ))}
      </div>
      <div className="grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <Skeleton variant="rect" width="70px" height="22px" style={{ borderRadius: "999px", marginBottom: "12px" }} />
            <Skeleton variant="text" width="90%" height="22px" style={{ marginBottom: "8px" }} />
            <Skeleton variant="text" width="60%" height="14px" style={{ marginBottom: "20px" }} />
            <div className="row" style={{ marginTop: "auto" }}>
              <Skeleton variant="rect" width="70px" height="36px" style={{ borderRadius: "8px" }} />
              <Skeleton variant="rect" width="120px" height="36px" style={{ borderRadius: "8px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssessmentSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading assessment">
      <Skeleton variant="text" width="240px" height="32px" style={{ marginBottom: "16px" }} />
      <div className="grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card tile">
            <Skeleton variant="text" width="70%" height="22px" style={{ marginBottom: "8px" }} />
            <Skeleton variant="text" width="40%" height="14px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading leaderboard">
      <Skeleton variant="text" width="200px" height="32px" style={{ marginBottom: "24px" }} />
      <div className="card" style={{ marginBottom: "24px" }}>
        <Skeleton variant="text" width="160px" height="20px" style={{ marginBottom: "10px" }} />
        <Skeleton variant="text" width="220px" height="28px" />
      </div>
      <div className="card">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              <Skeleton variant="circle" width="30px" height="30px" />
              <Skeleton variant="text" width="140px" height="18px" />
            </div>
            <Skeleton variant="text" width="60px" height="18px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading profile">
      <div className="card narrow">
        <Skeleton variant="text" width="180px" height="32px" style={{ marginBottom: "12px" }} />
        <Skeleton variant="text" width="240px" height="16px" style={{ marginBottom: "24px" }} />
        <Skeleton variant="rect" height="44px" style={{ borderRadius: "8px", marginBottom: "16px" }} />
        <Skeleton variant="rect" height="44px" style={{ borderRadius: "8px", marginBottom: "16px" }} />
        <Skeleton variant="rect" height="44px" style={{ borderRadius: "8px", marginBottom: "24px" }} />
        <Skeleton variant="rect" width="120px" height="42px" style={{ borderRadius: "8px" }} />
      </div>
    </div>
  );
}

export function SkillTreeSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading skill tree">
      <Skeleton variant="text" width="260px" height="32px" style={{ marginBottom: "20px" }} />
      <div className="card" style={{ height: "450px", display: "grid", placeItems: "center" }}>
        <Skeleton variant="rect" width="90%" height="80%" style={{ borderRadius: "12px" }} />
      </div>
    </div>
  );
}
