package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.CompleteRequest;
import com.learning.backend.entity.UserStats;
import com.learning.backend.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {
    private final ProgressService progress;

    @PostMapping("/complete")
    public UserStats complete(@Valid @RequestBody CompleteRequest r) { return progress.complete(r.resourceId()); }
}