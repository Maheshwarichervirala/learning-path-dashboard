package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboard;

    @GetMapping("/api/dashboard/summary")
    public DashboardSummary summary() { return dashboard.summary(); }

    @GetMapping("/api/dashboard/weekly")
    public WeeklyView weekly() { return dashboard.weekly(); }

    @GetMapping("/api/badges")
    public List<BadgeView> badges() { return dashboard.allBadges(); }
}