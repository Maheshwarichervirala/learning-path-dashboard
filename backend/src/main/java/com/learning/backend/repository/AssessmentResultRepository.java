package com.learning.backend.repository;

import com.learning.backend.entity.AssessmentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface AssessmentResultRepository extends JpaRepository<AssessmentResult, Long> {
    List<AssessmentResult> findByUserIdOrderByTakenAtAsc(Long userId);
}
