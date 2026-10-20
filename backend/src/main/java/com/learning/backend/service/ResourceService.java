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
    private final CurrentUser current;

    public List<Resource> bySkill(Long skillId) { return resources.findBySkillId(skillId); }

    public List<Resource> recommend() {
        Long uid = current.id();
        Optional<LearningPath> lp = paths.findFirstByUserIdOrderByCreatedAtDesc(uid);
        if (lp.isEmpty()) return List.of();

        Set<Long> done = progress.findByUserId(uid).stream()
                .filter(p -> "COMPLETED".equals(p.getStatus()))
                .map(UserProgress::getResourceId).collect(Collectors.toSet());

        List<Resource> candidates = steps.findByPathIdOrderByStepOrder(lp.get().getId()).stream()
                .filter(s -> !"COMPLETED".equals(s.getStatus()))
                .flatMap(s -> resources.findBySkillId(s.getSkillId()).stream()
                        .sorted(Comparator.comparingDouble((Resource r) -> r.getRating() == null ? 0 : r.getRating()).reversed()))
                .filter(r -> !done.contains(r.getId()))
                .limit(20).toList();

        Optional<List<Long>> ranked = ml.recommend(uid, candidates.stream().map(Resource::getId).toList());
        if (ranked.isEmpty()) return candidates;

        Map<Long, Integer> pos = new HashMap<>();
        List<Long> order = ranked.get();
        for (int i = 0; i < order.size(); i++) pos.put(order.get(i), i);
        return candidates.stream()
                .sorted(Comparator.comparingInt((Resource r) -> pos.getOrDefault(r.getId(), Integer.MAX_VALUE)))
                .toList();
    }
}