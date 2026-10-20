package com.learning.backend.repository;

import com.learning.backend.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {
    Optional<LearningPath> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
}
