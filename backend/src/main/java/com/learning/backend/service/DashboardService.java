package com.learning.backend.service;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.entity.*;
import com.learning.backend.repository.*;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final GamificationService gamification;
    private final AssessmentResultRepository assessments;
    private final LearningPathRepository paths;
    private final PathStepRepository steps;
    private final UserProgressRepository progress;
    private final UserBadgeRepository userBadges;
    private final BadgeRepository badges;
    private final CurrentUser current;

    public DashboardSummary summary() {
        Long uid = current.id();
        UserStats st = gamification.getStats(uid);
        var results = assessments.findByUserIdOrderByTakenAtAsc(uid);
        double avg = results.stream().mapToDouble(AssessmentResult::getScore).average().orElse(0);
        var trend = results.stream().map(r -> new ScorePoint(r.getTakenAt(), r.getScore())).toList();

        int total = 0, done = 0;
        var lp = paths.findFirstByUserIdOrderByCreatedAtDesc(uid);
        if (lp.isPresent()) {
            var list = steps.findByPathIdOrderByStepOrder(lp.get().getId());
            total = list.size();
            done = (int) list.stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
        }
        List<String> earned = userBadges.findByUserId(uid).stream()
                .map(ub -> badges.findById(ub.getBadgeId()).map(Badge::getName).orElse("?")).toList();

        return new DashboardSummary(st.getPoints(), st.getStreakDays(),
                progress.countByUserIdAndStatus(uid, "COMPLETED"), done, total, avg, trend, earned);
    }

    public List<BadgeView> allBadges() {
        Set<Long> mine = userBadges.findByUserId(current.id()).stream()
                .map(UserBadge::getBadgeId).collect(Collectors.toSet());
        return badges.findAll().stream()
                .map(b -> new BadgeView(b.getCode(), b.getName(), b.getDescription(), mine.contains(b.getId())))
                .toList();
    }
}