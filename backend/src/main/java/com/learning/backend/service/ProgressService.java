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

    @Transactional
    public com.learning.backend.dto.Dtos.ProgressStateView updateStatus(Long resourceId, String status) {
        Long uid = current.id();
        if (!resources.existsById(resourceId)) throw new NoSuchElementException("Resource not found");
        String normStatus = status.trim().toUpperCase();
        if (!java.util.Set.of("SAVED", "IN_PROGRESS", "COMPLETED").contains(normStatus)) {
            throw new IllegalArgumentException("Status must be one of SAVED, IN_PROGRESS, COMPLETED");
        }

        UserProgress up = progress.findByUserIdAndResourceId(uid, resourceId)
                .orElseGet(() -> UserProgress.builder().userId(uid).resourceId(resourceId).build());

        boolean wasCompleted = "COMPLETED".equals(up.getStatus());
        up.setStatus(normStatus);

        if ("COMPLETED".equals(normStatus)) {
            if (!wasCompleted) {
                up.setCompletedAt(LocalDateTime.now());
                gamification.awardPoints(uid, 20);
                gamification.touchStreak(uid);
                gamification.checkBadges(uid, null);
            }
        }
        progress.save(up);
        return new com.learning.backend.dto.Dtos.ProgressStateView(up.getResourceId(), up.getStatus(), up.getCompletedAt());
    }

    public java.util.List<com.learning.backend.dto.Dtos.ProgressStateView> getMine() {
        Long uid = current.id();
        return progress.findByUserId(uid).stream()
                .map(p -> new com.learning.backend.dto.Dtos.ProgressStateView(p.getResourceId(), p.getStatus(), p.getCompletedAt()))
                .toList();
    }
}