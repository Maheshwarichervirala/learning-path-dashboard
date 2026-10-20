package com.learning.backend.service;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.entity.*;
import com.learning.backend.repository.*;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PathService {
    private final UserProfileRepository profiles;
    private final SkillRepository skills;
    private final UserSkillRepository userSkills;
    private final LearningPathRepository paths;
    private final PathStepRepository steps;
    private final CurrentUser current;

    @Transactional
    public PathView generate() {
        Long uid = current.id();
        UserProfile p = profiles.findById(uid)
                .orElseThrow(() -> new IllegalStateException("Complete your profile first"));
        List<Skill> domainSkills = skills.findByDomain(p.getDomain());
        Map<Long, Skill> byId = domainSkills.stream().collect(Collectors.toMap(Skill::getId, s -> s));
        Map<Long, Double> prof = userSkills.findByUserId(uid).stream()
                .collect(Collectors.toMap(UserSkill::getSkillId, UserSkill::getProficiencyScore));

        List<Skill> gaps = domainSkills.stream()
                .filter(s -> prof.getOrDefault(s.getId(), 0.0) < 70)
                .sorted(Comparator.comparingInt((Skill s) -> depth(s, byId)).thenComparing(Skill::getDifficulty))
                .toList();

        LearningPath path = paths.save(LearningPath.builder().userId(uid).careerGoal(p.getCareerGoal()).build());
        int order = 1;
        for (Skill s : gaps) {
            steps.save(PathStep.builder().pathId(path.getId()).stepOrder(order++)
                    .skillId(s.getId()).status("NOT_STARTED").build());
        }
        return view(path);
    }

    public PathView getCurrent() {
        LearningPath path = paths.findFirstByUserIdOrderByCreatedAtDesc(current.id())
                .orElseThrow(() -> new NoSuchElementException("No learning path yet. Generate one first."));
        return view(path);
    }

    @Transactional
    public void markSkillDone(Long uid, Long skillId) {
        paths.findFirstByUserIdOrderByCreatedAtDesc(uid).ifPresent(path ->
            steps.findByPathIdOrderByStepOrder(path.getId()).stream()
                .filter(st -> st.getSkillId().equals(skillId))
                .forEach(st -> { st.setStatus("COMPLETED"); steps.save(st); }));
    }

    private PathView view(LearningPath path) {
        Map<Long, Double> prof = userSkills.findByUserId(path.getUserId()).stream()
                .collect(Collectors.toMap(UserSkill::getSkillId, UserSkill::getProficiencyScore));
        List<StepView> list = steps.findByPathIdOrderByStepOrder(path.getId()).stream()
                .map(st -> new StepView(st.getStepOrder(), st.getSkillId(),
                        skills.findById(st.getSkillId()).map(Skill::getName).orElse("?"),
                        st.getStatus(), prof.getOrDefault(st.getSkillId(), 0.0)))
                .toList();
        return new PathView(path.getId(), path.getCareerGoal(), list);
    }

    private int depth(Skill s, Map<Long, Skill> byId) {
        int d = 0;
        Long pre = s.getPrerequisiteSkillId();
        while (pre != null && byId.containsKey(pre) && d < 20) {
            d++;
            pre = byId.get(pre).getPrerequisiteSkillId();
        }
        return d;
    }
}