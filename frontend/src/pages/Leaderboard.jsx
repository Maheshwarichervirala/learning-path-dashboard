import { useEffect, useState } from "react";
import { Trophy, Medal, Star, Flame } from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import { LeaderboardSkeleton } from "../components/Skeleton";

export default function Leaderboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [topUsers, setTopUsers] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [boardRes, rankRes] = await Promise.allSettled([
          api.get("/leaderboard"),
          api.get("/leaderboard/rank"),
        ]);

        if (boardRes.status === "fulfilled" && mounted) {
          setTopUsers(boardRes.value.data || []);
        }

        if (rankRes.status === "fulfilled" && mounted) {
          setUserRank(rankRes.value.data);
        }
      } catch (err) {
        toast.error(errMsg(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LeaderboardSkeleton />;

  const getRankBadge = (index) => {
    if (index === 0) return <span className="rank-medal gold" title="1st Place">🥇</span>;
    if (index === 1) return <span className="rank-medal silver" title="2nd Place">🥈</span>;
    if (index === 2) return <span className="rank-medal bronze" title="3rd Place">🥉</span>;
    return <span className="rank-number">#{index + 1}</span>;
  };

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>Leaderboard</h1>
        <p className="page-subtitle">See where you stand among top learners in the community</p>
      </div>

      {/* Current User Rank Card */}
      {userRank && (
        <div className="card user-rank-highlight">
          <div className="user-rank-icon">
            <Trophy size={32} />
          </div>
          <div className="user-rank-info">
            <span className="user-rank-label">Your Current Standing</span>
            <div className="user-rank-metrics">
              <span className="user-rank-position">
                Rank <strong>#{userRank.rank}</strong>
              </span>
              <span className="user-rank-points">
                <Flame size={18} className="points-flame" />
                <strong>{userRank.points}</strong> points
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table / Card List */}
      <div className="card leaderboard-table-card">
        <h2 className="card-heading">
          <Medal size={20} className="heading-icon" />
          Top 10 Learners
        </h2>

        {topUsers.length === 0 ? (
          <div className="empty-state">
            <p className="muted">No leaderboard rankings recorded yet. Start learning to earn points!</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            <div className="leaderboard-header-row">
              <span className="col-rank">Rank</span>
              <span className="col-user">Learner</span>
              <span className="col-points">Points</span>
            </div>
            {topUsers.map((item, index) => {
              const isCurrentUser = user && item.name === user.name;
              return (
                <div
                  key={`${item.name}-${index}`}
                  className={`leaderboard-row ${isCurrentUser ? "is-you" : ""} ${index < 3 ? "podium-row" : ""}`}
                >
                  <div className="col-rank">{getRankBadge(index)}</div>
                  <div className="col-user">
                    <span className="learner-name">{item.name}</span>
                    {isCurrentUser && <span className="you-pill">You</span>}
                  </div>
                  <div className="col-points">
                    <span className="points-value">
                      <Star size={14} className="star-icon" />
                      {item.points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
