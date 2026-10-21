package com.learning.backend.repository;

import com.learning.backend.entity.DailyGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DailyGoalRepository extends JpaRepository<DailyGoal, Long> {
    Optional<DailyGoal> findByUserId(Long userId);
}
