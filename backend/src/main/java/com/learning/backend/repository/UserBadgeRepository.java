package com.learning.backend.repository;

import com.learning.backend.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserId(Long userId);
    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);
}
