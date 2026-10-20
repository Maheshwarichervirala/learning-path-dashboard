package com.learning.backend.repository;

import com.learning.backend.entity.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserStatsRepository extends JpaRepository<UserStats, Long> {

}
