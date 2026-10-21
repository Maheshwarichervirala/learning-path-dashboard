package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.LeaderboardEntry;
import com.learning.backend.dto.Dtos.UserRankView;
import com.learning.backend.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    @GetMapping
    public List<LeaderboardEntry> getTopUsers() {
        return leaderboardService.getTop10();
    }

    @GetMapping("/rank")
    public UserRankView getMyRank() {
        return leaderboardService.getCurrentUserRank();
    }
}
