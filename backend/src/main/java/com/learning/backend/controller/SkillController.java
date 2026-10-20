package com.learning.backend.controller;

import com.learning.backend.entity.Skill;
import com.learning.backend.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {
    private final SkillRepository skills;

    @GetMapping
    public List<Skill> list(@RequestParam(required = false) String domain) {
        return domain == null ? skills.findAll() : skills.findByDomain(domain);
    }

    @GetMapping("/domains")
    public List<String> domains() { return skills.findDomains(); }
}