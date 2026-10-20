package com.learning.backend.repository;

import com.learning.backend.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByCode(String code);
}
