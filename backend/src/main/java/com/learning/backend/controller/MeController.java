package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.LevelView;
import com.learning.backend.service.AssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MeController {
    private final AssessmentService assessments;

    @GetMapping("/api/me/level")
    public LevelView getLevel() {
        return assessments.getUserLevel();
    }
}
