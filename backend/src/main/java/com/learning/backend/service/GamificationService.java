package com.learning.backend.service;

import com.learning.backend.entity.Skill;
import com.learning.backend.entity.UserBadge;
import com.learning.backend.entity.UserSkill;
import com.learning.backend.entity.UserStats;
import com.learning.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GamificationService {
    private final UserStatsRepository stats;
    private final BadgeRepository badges;
    private final UserBadgeRepository userBadges;
    private final UserProgressRepository progress;
    private final AssessmentResultRepository assessments;
    private final SkillRepository skills;
    private final UserSkillRepository userSkills;
    private final LearningPathRepository paths;
    private final PathStepRepository steps;

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
        // Original badges
        if (progress.countByUserIdAndStatus(uid, "COMPLETED") >= 1) award(uid, "FIRST_STEP");
        if (s.getStreakDays() >= 3) award(uid, "STREAK_3");
        if (s.getPoints() >= 100) award(uid, "CENTURY");
        if (latestScore != null && latestScore >= 90) award(uid, "ACE");

        // 8 New badges
        // 1. QUIZ_MASTER: 5 or more quizzes taken
        if (assessments.countByUserId(uid) >= 5) award(uid, "QUIZ_MASTER");

        // 2. POLYGLOT: skills practiced across 3 different domains
        List<Long> skillIds = userSkills.findByUserId(uid).stream().map(UserSkill::getSkillId).toList();
        long distinctDomains = skills.findAllById(skillIds).stream().map(Skill::getDomain).distinct().count();
        if (distinctDomains >= 3) award(uid, "POLYGLOT");

        // 3. STREAK_7: 7-day streak
        if (s.getStreakDays() >= 7) award(uid, "STREAK_7");

        // 4. HIGH_ROLLER: 500 points
        if (s.getPoints() >= 500) award(uid, "HIGH_ROLLER");

        // 5. PATH_FINISHER: completed all steps in active learning path
        paths.findFirstByUserIdOrderByCreatedAtDesc(uid).ifPresent(lp -> {
            var stepList = steps.findByPathIdOrderByStepOrder(lp.getId());
            if (!stepList.isEmpty() && stepList.stream().allMatch(st -> "COMPLETED".equals(st.getStatus()))) {
                award(uid, "PATH_FINISHER");
            }
        });

        // 6. RESOURCE_CHAMP: 10 completed resources
        if (progress.countByUserIdAndStatus(uid, "COMPLETED") >= 10) award(uid, "RESOURCE_CHAMP");

        // 7. PERFECT_SCORE: 100% on a quiz
        if (latestScore != null && latestScore >= 100) award(uid, "PERFECT_SCORE");

        // 8. FAST_LEARNER: reached 250 points
        if (s.getPoints() >= 250) award(uid, "FAST_LEARNER");
    }

    private void award(Long uid, String code) {
        badges.findByCode(code).ifPresent(b -> {
            if (!userBadges.existsByUserIdAndBadgeId(uid, b.getId()))
                userBadges.save(UserBadge.builder().userId(uid).badgeId(b.getId()).build());
        });
    }
}