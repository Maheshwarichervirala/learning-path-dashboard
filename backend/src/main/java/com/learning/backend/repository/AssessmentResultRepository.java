package com.learning.backend.repository;

import com.learning.backend.entity.AssessmentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface AssessmentResultRepository extends JpaRepository<AssessmentResult, Long> {
    List<AssessmentResult> findByUserIdOrderByTakenAtAsc(Long userId);
    List<AssessmentResult> findByUserIdAndSkillIdOrderByTakenAtDesc(Long userId, Long skillId);
    long countByUserId(Long userId);
    List<AssessmentResult> findByUserIdAndTakenAtGreaterThanEqual(Long userId, java.time.LocalDateTime date);
    List<AssessmentResult> findByUserIdAndTakenAtBetween(Long userId, java.time.LocalDateTime start, java.time.LocalDateTime end);
    boolean existsBySkillId(Long skillId);
}
