package com.learning.backend.service;

import com.learning.backend.dto.Dtos.GoalRequest;
import com.learning.backend.dto.Dtos.GoalView;
import com.learning.backend.entity.DailyGoal;
import com.learning.backend.repository.DailyGoalRepository;
import com.learning.backend.repository.UserProgressRepository;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GoalService {
    private final DailyGoalRepository goals;
    private final UserProgressRepository progress;
    private final CurrentUser current;

    public GoalView getGoal() {
        Long uid = current.id();
        DailyGoal g = goals.findByUserId(uid)
                .orElseGet(() -> DailyGoal.builder().userId(uid).target(1).build());

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        int completedToday = progress.findByUserIdAndStatusAndCompletedAtGreaterThanEqual(uid, "COMPLETED", startOfDay).size();
        boolean met = completedToday >= g.getTarget();

        return new GoalView(g.getTarget(), completedToday, met);
    }

    @Transactional
    public GoalView updateGoal(GoalRequest req) {
        Long uid = current.id();
        int target = Math.max(1, Math.min(5, req.target()));
        DailyGoal g = goals.findByUserId(uid)
                .orElseGet(() -> DailyGoal.builder().userId(uid).target(target).build());
        g.setTarget(target);
        goals.save(g);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        int completedToday = progress.findByUserIdAndStatusAndCompletedAtGreaterThanEqual(uid, "COMPLETED", startOfDay).size();
        boolean met = completedToday >= target;

        return new GoalView(target, completedToday, met);
    }
}
