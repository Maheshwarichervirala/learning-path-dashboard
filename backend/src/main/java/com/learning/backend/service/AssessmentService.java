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
    private final MlClient ml;
    private final UserProfileRepository profiles;

    public List<QuestionView> getQuestions(Long skillId) {
        List<Question> all = new ArrayList<>(questions.findBySkillId(skillId));
        Collections.shuffle(all);
        List<Question> picked = all.stream().limit(10).toList();
        return picked.stream()
                .map(q -> new QuestionView(q.getId(), q.getQuestionText(), List.of(q.getOptions().split("\\|"))))
                .toList();
    }

    public List<AttemptHistoryView> getHistory(Long skillId) {
        Long uid = current.id();
        return results.findByUserIdAndSkillIdOrderByTakenAtDesc(uid, skillId).stream()
                .map(r -> {
                    int total = 10;
                    int correct = (int) Math.round(r.getScore() * total / 100.0);
                    return new AttemptHistoryView(r.getScore(), correct, total, r.getTakenAt());
                })
                .toList();
    }

    @Transactional
    public SubmitResponse submit(SubmitRequest req) {
        Long uid = current.id();
        List<Question> qs = questions.findBySkillId(req.skillId());
        if (qs.isEmpty()) throw new NoSuchElementException("No questions found for this skill");

        List<Question> answeredQs = qs.stream()
                .filter(q -> req.answers().containsKey(q.getId()))
                .toList();
        int totalServed = !answeredQs.isEmpty() ? answeredQs.size() : req.answers().size();
        if (totalServed == 0) throw new IllegalArgumentException("No answers provided");

        int correct = 0;
        for (Question q : answeredQs) {
            Integer picked = req.answers().get(q.getId());
            if (picked != null && picked.equals(q.getCorrectIndex())) correct++;
        }
        double score = Math.round(correct * 10000.0 / totalServed) / 100.0;

        results.save(AssessmentResult.builder().userId(uid).skillId(req.skillId()).score(score).build());
        UserSkill us = userSkills.findByUserIdAndSkillId(uid, req.skillId())
                .orElseGet(() -> UserSkill.builder().userId(uid).skillId(req.skillId()).build());
        double bestProficiency = Math.max(us.getProficiencyScore() != null ? us.getProficiencyScore() : 0.0, score);
        us.setProficiencyScore(bestProficiency);
        userSkills.save(us);

        boolean passed = score >= 70;
        if (passed) pathService.markSkillDone(uid, req.skillId());

        gamification.awardPoints(uid, 10 + (int) (score / 10));
        gamification.touchStreak(uid);
        gamification.checkBadges(uid, score);

        List<AssessmentResult> allResults = results.findByUserIdOrderByTakenAtAsc(uid);
        int quizzesTaken = allResults.size();
        double avgScore = allResults.stream().mapToDouble(AssessmentResult::getScore).average().orElse(score);
        double lastScore = score;

        String fallbackLevel = score < 40 ? "Beginner" : score < 75 ? "Intermediate" : "Advanced";
        String level = ml.classifyLevel(avgScore, lastScore, quizzesTaken)
                .map(MlClient.ClassifiedLevel::level)
                .orElse(fallbackLevel);

        profiles.findById(uid).ifPresent(p -> {
            p.setExperienceLevel(level);
            profiles.save(p);
        });

        return new SubmitResponse(score, correct, totalServed, level, passed);
    }

    public LevelView getUserLevel() {
        Long uid = current.id();
        List<AssessmentResult> allResults = results.findByUserIdOrderByTakenAtAsc(uid);
        if (allResults.isEmpty()) {
            String defaultLevel = profiles.findById(uid)
                    .map(UserProfile::getExperienceLevel)
                    .filter(s -> !s.isBlank())
                    .orElse("Beginner");
            return new LevelView(defaultLevel, null);
        }

        int quizzesTaken = allResults.size();
        double avgScore = allResults.stream().mapToDouble(AssessmentResult::getScore).average().orElse(0.0);
        double lastScore = allResults.get(allResults.size() - 1).getScore();
        String fallbackLevel = lastScore < 40 ? "Beginner" : lastScore < 75 ? "Intermediate" : "Advanced";

        return ml.classifyLevel(avgScore, lastScore, quizzesTaken)
                .map(cl -> {
                    profiles.findById(uid).ifPresent(p -> {
                        p.setExperienceLevel(cl.level());
                        profiles.save(p);
                    });
                    return new LevelView(cl.level(), cl.confidence());
                })
                .orElseGet(() -> {
                    profiles.findById(uid).ifPresent(p -> {
                        p.setExperienceLevel(fallbackLevel);
                        profiles.save(p);
                    });
                    return new LevelView(fallbackLevel, null);
                });
    }
}