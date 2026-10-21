package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.entity.Question;
import com.learning.backend.entity.Resource;
import com.learning.backend.entity.Skill;
import com.learning.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService admin;

    // Skills
    @GetMapping("/skills")
    public List<Skill> listSkills() {
        return admin.listSkills();
    }

    @PostMapping("/skills")
    public Skill createSkill(@Valid @RequestBody AdminSkillRequest req) {
        return admin.createSkill(req);
    }

    @PutMapping("/skills/{id}")
    public Skill updateSkill(@PathVariable Long id, @Valid @RequestBody AdminSkillRequest req) {
        return admin.updateSkill(id, req);
    }

    @DeleteMapping("/skills/{id}")
    public Map<String, String> deleteSkill(@PathVariable Long id) {
        admin.deleteSkill(id);
        return Map.of("message", "Skill deleted successfully");
    }

    // Questions
    @GetMapping("/questions")
    public List<Question> listQuestions(@RequestParam(required = false) Long skillId) {
        return admin.listQuestions(skillId);
    }

    @PostMapping("/questions")
    public Question createQuestion(@Valid @RequestBody AdminQuestionRequest req) {
        return admin.createQuestion(req);
    }

    @PutMapping("/questions/{id}")
    public Question updateQuestion(@PathVariable Long id, @Valid @RequestBody AdminQuestionRequest req) {
        return admin.updateQuestion(id, req);
    }

    @DeleteMapping("/questions/{id}")
    public Map<String, String> deleteQuestion(@PathVariable Long id) {
        admin.deleteQuestion(id);
        return Map.of("message", "Question deleted successfully");
    }

    // Resources
    @GetMapping("/resources")
    public List<Resource> listResources(@RequestParam(required = false) Long skillId) {
        return admin.listResources(skillId);
    }

    @PostMapping("/resources")
    public Resource createResource(@Valid @RequestBody AdminResourceRequest req) {
        return admin.createResource(req);
    }

    @PutMapping("/resources/{id}")
    public Resource updateResource(@PathVariable Long id, @Valid @RequestBody AdminResourceRequest req) {
        return admin.updateResource(id, req);
    }

    @DeleteMapping("/resources/{id}")
    public Map<String, String> deleteResource(@PathVariable Long id) {
        admin.deleteResource(id);
        return Map.of("message", "Resource deleted successfully");
    }
}
