package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.PathView;
import com.learning.backend.service.PathService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/paths")
@RequiredArgsConstructor
public class PathController {
    private final PathService paths;

    @GetMapping("/me")
    public PathView mine() { return paths.getCurrent(); }

    @PostMapping("/generate")
    public PathView generate() { return paths.generate(); }
}