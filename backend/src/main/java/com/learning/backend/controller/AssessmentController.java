package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
public class AssessmentController {
    private final AssessmentService assessments;

    @GetMapping("/{skillId}")
    public List<QuestionView> questions(@PathVariable Long skillId) { return assessments.getQuestions(skillId); }

    @GetMapping("/history")
    public List<AttemptHistoryView> history(@RequestParam Long skillId) { return assessments.getHistory(skillId); }

    @PostMapping("/submit")
    public SubmitResponse submit(@Valid @RequestBody SubmitRequest r) { return assessments.submit(r); }
}