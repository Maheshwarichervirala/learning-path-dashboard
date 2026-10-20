package com.learning.backend.repository;

import com.learning.backend.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    List<UserSkill> findByUserId(Long userId);
    Optional<UserSkill> findByUserIdAndSkillId(Long userId, Long skillId);
}
