package com.learning.backend.controller;

import com.learning.backend.entity.Resource;
import com.learning.backend.service.ExternalResourceService;
import com.learning.backend.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService resources;
    private final ExternalResourceService external;

    @GetMapping("/api/resources")
    public List<Resource> bySkill(@RequestParam Long skillId) { return resources.bySkill(skillId); }

    @GetMapping("/api/recommendations")
    public List<Resource> recommendations() { return resources.recommend(); }

    @PostMapping("/api/admin/resources/import/{skillId}")
    public Map<String, Integer> importExternal(@PathVariable Long skillId) {
        return Map.of("added", external.importFor(skillId));
    }
}