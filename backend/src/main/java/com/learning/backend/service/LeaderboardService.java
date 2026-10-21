package com.learning.backend.service;

import com.learning.backend.dto.Dtos.LeaderboardEntry;
import com.learning.backend.dto.Dtos.UserRankView;
import com.learning.backend.entity.User;
import com.learning.backend.entity.UserStats;
import com.learning.backend.repository.UserRepository;
import com.learning.backend.repository.UserStatsRepository;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LeaderboardService {
    private final UserStatsRepository statsRepo;
    private final UserRepository userRepo;
    private final CurrentUser current;

    public List<LeaderboardEntry> getTop10() {
        List<UserStats> topStats = statsRepo.findTop10ByOrderByPointsDesc();
        if (topStats.isEmpty()) return List.of();

        Set<Long> userIds = new HashSet<>();
        for (UserStats s : topStats) {
            userIds.add(s.getUserId());
        }

        Map<Long, String> nameMap = new HashMap<>();
        for (User u : userRepo.findAllById(userIds)) {
            nameMap.put(u.getId(), u.getName());
        }

        return topStats.stream()
                .map(s -> new LeaderboardEntry(
                        nameMap.getOrDefault(s.getUserId(), "Anonymous"),
                        s.getPoints() != null ? s.getPoints() : 0
                ))
                .toList();
    }

    public UserRankView getCurrentUserRank() {
        User u = current.get();
        UserStats stats = statsRepo.findById(u.getId()).orElse(null);
        int points = (stats != null && stats.getPoints() != null) ? stats.getPoints() : 0;
        int rank = (int) statsRepo.countByPointsGreaterThan(points) + 1;
        return new UserRankView(rank, points, u.getName());
    }
}
