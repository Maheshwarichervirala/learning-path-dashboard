package com.learning.backend.repository;

import com.learning.backend.entity.PathStep;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface PathStepRepository extends JpaRepository<PathStep, Long> {
    List<PathStep> findByPathIdOrderByStepOrder(Long pathId);
}
