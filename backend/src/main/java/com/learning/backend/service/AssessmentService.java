package com.learning.backend.service;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.entity.*;
import com.learning.backend.repository.*;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AssessmentService {
    private final QuestionRepository questions;
    private final AssessmentResultRepository results;
    private final UserSkillRepository userSkills;
    private final PathService pathService;
    private final GamificationService gamification;
    private final CurrentUser current;

    public List<QuestionView> getQuestions(Long skillId) {
        return questions.findBySkillId(skillId).stream()
                .map(q -> new QuestionView(q.getId(), q.getQuestionText(), List.of(q.getOptions().split("\\|"))))
                .toList();
    }

    @Transactional
    public SubmitResponse submit(SubmitRequest req) {
        Long uid = current.id();
        List<Question> qs = questions.findBySkillId(req.skillId());
        if (qs.isEmpty()) throw new NoSuchElementException("No questions found for this skill");

        int correct = 0;
        for (Question q : qs) {
            Integer picked = req.answers().get(q.getId());
            if (picked != null && picked.equals(q.getCorrectIndex())) correct++;
        }
        double score = Math.round(correct * 10000.0 / qs.size()) / 100.0;

        results.save(AssessmentResult.builder().userId(uid).skillId(req.skillId()).score(score).build());
        UserSkill us = userSkills.findByUserIdAndSkillId(uid, req.skillId())
                .orElseGet(() -> UserSkill.builder().userId(uid).skillId(req.skillId()).build());
        us.setProficiencyScore(score);
        userSkills.save(us);

        boolean passed = score >= 70;
        if (passed) pathService.markSkillDone(uid, req.skillId());

        gamification.awardPoints(uid, 10 + (int) (score / 10));
        gamification.touchStreak(uid);
        gamification.checkBadges(uid, score);

        String level = score < 40 ? "Beginner" : score < 75 ? "Intermediate" : "Advanced";
        return new SubmitResponse(score, correct, qs.size(), level, passed);
    }
}