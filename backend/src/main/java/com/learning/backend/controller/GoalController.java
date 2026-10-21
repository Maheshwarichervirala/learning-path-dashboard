package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.GoalRequest;
import com.learning.backend.dto.Dtos.GoalView;
import com.learning.backend.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {
    private final GoalService goals;

    @GetMapping
    public GoalView getGoal() {
        return goals.getGoal();
    }

    @PutMapping
    public GoalView updateGoal(@Valid @RequestBody GoalRequest req) {
        return goals.updateGoal(req);
    }
}
