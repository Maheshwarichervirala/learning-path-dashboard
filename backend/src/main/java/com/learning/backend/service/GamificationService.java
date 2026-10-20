package com.learning.backend.service;

import com.learning.backend.entity.UserBadge;
import com.learning.backend.entity.UserStats;
import com.learning.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class GamificationService {
    private final UserStatsRepository stats;
    private final BadgeRepository badges;
    private final UserBadgeRepository userBadges;
    private final UserProgressRepository progress;

    public UserStats getStats(Long uid) {
        return stats.findById(uid).orElseGet(() -> new UserStats(uid, 0, 0, null));
    }

    @Transactional
    public void awardPoints(Long uid, int pts) {
        UserStats s = getStats(uid);
        s.setPoints(s.getPoints() + pts);
        stats.save(s);
    }

    @Transactional
    public void touchStreak(Long uid) {
        UserStats s = getStats(uid);
        LocalDate today = LocalDate.now();
        LocalDate last = s.getLastActiveDate();
        if (last == null || ChronoUnit.DAYS.between(last, today) > 1) s.setStreakDays(1);
        else if (last.isBefore(today)) s.setStreakDays(s.getStreakDays() + 1);
        s.setLastActiveDate(today);
        stats.save(s);
    }

    @Transactional
    public void checkBadges(Long uid, Double latestScore) {
        UserStats s = getStats(uid);
        if (progress.countByUserIdAndStatus(uid, "COMPLETED") >= 1) award(uid, "FIRST_STEP");
        if (s.getStreakDays() >= 3) award(uid, "STREAK_3");
        if (s.getPoints() >= 100) award(uid, "CENTURY");
        if (latestScore != null && latestScore >= 90) award(uid, "ACE");
    }

    private void award(Long uid, String code) {
        badges.findByCode(code).ifPresent(b -> {
            if (!userBadges.existsByUserIdAndBadgeId(uid, b.getId()))
                userBadges.save(UserBadge.builder().userId(uid).badgeId(b.getId()).build());
        });
    }
}