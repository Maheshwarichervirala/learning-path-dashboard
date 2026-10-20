package com.learning.backend.service;

import com.learning.backend.entity.UserProgress;
import com.learning.backend.entity.UserStats;
import com.learning.backend.repository.ResourceRepository;
import com.learning.backend.repository.UserProgressRepository;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ProgressService {
    private final ResourceRepository resources;
    private final UserProgressRepository progress;
    private final GamificationService gamification;
    private final CurrentUser current;

    @Transactional
    public UserStats complete(Long resourceId) {
        Long uid = current.id();
        if (!resources.existsById(resourceId)) throw new NoSuchElementException("Resource not found");
        UserProgress up = progress.findByUserIdAndResourceId(uid, resourceId)
                .orElseGet(() -> UserProgress.builder().userId(uid).resourceId(resourceId).build());
        if (!"COMPLETED".equals(up.getStatus())) {
            up.setStatus("COMPLETED");
            up.setCompletedAt(LocalDateTime.now());
            progress.save(up);
            gamification.awardPoints(uid, 20);
            gamification.touchStreak(uid);
            gamification.checkBadges(uid, null);
        }
        return gamification.getStats(uid);
    }
}