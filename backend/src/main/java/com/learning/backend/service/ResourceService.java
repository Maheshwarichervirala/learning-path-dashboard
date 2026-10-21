package com.learning.backend.service;

import com.learning.backend.entity.*;
import com.learning.backend.repository.*;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {
    private final ResourceRepository resources;
    private final LearningPathRepository paths;
    private final PathStepRepository steps;
    private final UserProgressRepository progress;
    private final MlClient ml;
    private final ResourceFeedbackRepository feedbackRepo;
    private final CurrentUser current;
    private final UserProfileRepository profiles;
    private final AssessmentResultRepository assessments;

    public List<Resource> bySkill(Long skillId) { return resources.findBySkillId(skillId); }
    public List<Resource> all() { return resources.findAll(); }

    private Integer getPreferredDifficulty(Long uid) {
        String level = profiles.findById(uid)
                .map(UserProfile::getExperienceLevel)
                .filter(s -> !s.isBlank())
                .orElse(null);

        if (level == null) {
            var results = assessments.findByUserIdOrderByTakenAtAsc(uid);
            if (!results.isEmpty()) {
                double lastScore = results.get(results.size() - 1).getScore();
                level = lastScore < 40 ? "Beginner" : lastScore < 75 ? "Intermediate" : "Advanced";
            }
        }

        if (level == null) return null;
        return switch (level.trim().toLowerCase()) {
            case "beginner" -> 1;
            case "intermediate" -> 2;
            case "advanced" -> 3;
            default -> null;
        };
    }

    public List<Resource> recommend() {
        Long uid = current.id();
        Optional<LearningPath> lp = paths.findFirstByUserIdOrderByCreatedAtDesc(uid);
        if (lp.isEmpty()) return List.of();

        List<Long> completedIds = progress.findByUserId(uid).stream()
                .filter(p -> "COMPLETED".equals(p.getStatus()))
                .map(UserProgress::getResourceId)
                .toList();
        Set<Long> done = new HashSet<>(completedIds);

        List<Resource> candidates = steps.findByPathIdOrderByStepOrder(lp.get().getId()).stream()
                .filter(s -> !"COMPLETED".equals(s.getStatus()))
                .flatMap(s -> resources.findBySkillId(s.getSkillId()).stream()
                        .sorted(Comparator.comparingDouble((Resource r) -> r.getRating() == null ? 0 : r.getRating()).reversed()))
                .filter(r -> !done.contains(r.getId()))
                .limit(20).toList();

        Integer preferredDifficulty = getPreferredDifficulty(uid);
        Optional<List<Long>> ranked = ml.recommend(
                uid,
                candidates.stream().map(Resource::getId).toList(),
                completedIds,
                preferredDifficulty
        );
        List<Resource> ordered = candidates;
        if (ranked.isPresent()) {
            Map<Long, Integer> pos = new HashMap<>();
            List<Long> order = ranked.get();
            for (int i = 0; i < order.size(); i++) pos.put(order.get(i), i);
            ordered = candidates.stream()
                    .sorted(Comparator.comparingInt((Resource r) -> pos.getOrDefault(r.getId(), Integer.MAX_VALUE)))
                    .toList();
        }

        Map<Long, Integer> feedbackMap = feedbackRepo.findByUserId(uid).stream()
                .collect(Collectors.toMap(ResourceFeedback::getResourceId, ResourceFeedback::getValue, (a, b) -> b));

        return ordered.stream()
                .sorted(Comparator.comparingInt((Resource r) -> feedbackMap.getOrDefault(r.getId(), 0) == -1 ? 1 : 0))
                .toList();
    }
}