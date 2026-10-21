package com.learning.backend.repository;

import com.learning.backend.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    List<UserProgress> findByUserId(Long userId);
    Optional<UserProgress> findByUserIdAndResourceId(Long userId, Long resourceId);
    long countByUserIdAndStatus(Long userId, String status);
    boolean existsByResourceId(Long resourceId);
    List<UserProgress> findByUserIdAndStatusAndCompletedAtGreaterThanEqual(Long userId, String status, java.time.LocalDateTime date);
    List<UserProgress> findByUserIdAndStatusAndCompletedAtBetween(Long userId, String status, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
