package com.learning.backend.service;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.entity.Question;
import com.learning.backend.entity.Resource;
import com.learning.backend.entity.Skill;
import com.learning.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final SkillRepository skills;
    private final QuestionRepository questions;
    private final ResourceRepository resources;
    private final PathStepRepository pathSteps;
    private final UserSkillRepository userSkills;
    private final AssessmentResultRepository assessments;
    private final UserProgressRepository userProgress;
    private final ResourceFeedbackRepository feedback;
    private final ResourceNoteRepository notes;

    // --- Skills CRUD ---

    public List<Skill> listSkills() {
        return skills.findAll();
    }

    @Transactional
    public Skill createSkill(AdminSkillRequest req) {
        validateSkillPrerequisite(req.id(), req.prerequisiteSkillId());
        Long id = req.id();
        if (id == null) {
            id = skills.findAll().stream().mapToLong(Skill::getId).max().orElse(0L) + 1;
        } else if (skills.existsById(id)) {
            throw new IllegalArgumentException("Skill ID " + id + " already exists");
        }
        Skill s = Skill.builder()
                .id(id)
                .name(req.name().trim())
                .domain(req.domain().trim())
                .difficulty(req.difficulty())
                .prerequisiteSkillId(req.prerequisiteSkillId())
                .build();
        return skills.save(s);
    }

    @Transactional
    public Skill updateSkill(Long id, AdminSkillRequest req) {
        Skill s = skills.findById(id).orElseThrow(() -> new NoSuchElementException("Skill not found"));
        validateSkillPrerequisite(id, req.prerequisiteSkillId());
        s.setName(req.name().trim());
        s.setDomain(req.domain().trim());
        s.setDifficulty(req.difficulty());
        s.setPrerequisiteSkillId(req.prerequisiteSkillId());
        return skills.save(s);
    }

    @Transactional
    public void deleteSkill(Long id) {
        if (!skills.existsById(id)) throw new NoSuchElementException("Skill not found");
        if (skills.existsByPrerequisiteSkillId(id)) {
            throw new IllegalStateException("Cannot delete skill: other skills have it as a prerequisite");
        }
        if (pathSteps.existsBySkillId(id)) {
            throw new IllegalStateException("Cannot delete skill: referenced in learning path steps");
        }
        if (questions.existsBySkillId(id)) {
            throw new IllegalStateException("Cannot delete skill: questions are associated with it");
        }
        if (resources.existsBySkillId(id)) {
            throw new IllegalStateException("Cannot delete skill: learning resources are associated with it");
        }
        if (userSkills.existsBySkillId(id) || assessments.existsBySkillId(id)) {
            throw new IllegalStateException("Cannot delete skill: user assessment history exists for it");
        }
        skills.deleteById(id);
    }

    private void validateSkillPrerequisite(Long skillId, Long prerequisiteId) {
        if (prerequisiteId == null) return;
        if (!skills.existsById(prerequisiteId)) {
            throw new IllegalArgumentException("Prerequisite skill with ID " + prerequisiteId + " does not exist");
        }
        if (skillId != null) {
            if (skillId.equals(prerequisiteId)) {
                throw new IllegalArgumentException("A skill cannot be its own prerequisite");
            }
            // Check for cycles by following the prerequisite chain
            Long curr = prerequisiteId;
            int depth = 0;
            while (curr != null && depth < 50) {
                if (curr.equals(skillId)) {
                    throw new IllegalArgumentException("Prerequisite cycle detected between skills");
                }
                curr = skills.findById(curr).map(Skill::getPrerequisiteSkillId).orElse(null);
                depth++;
            }
        }
    }

    // --- Questions CRUD ---

    public List<Question> listQuestions(Long skillId) {
        return skillId == null ? questions.findAll() : questions.findBySkillId(skillId);
    }

    @Transactional
    public Question createQuestion(AdminQuestionRequest req) {
        if (!skills.existsById(req.skillId())) {
            throw new NoSuchElementException("Skill not found for ID " + req.skillId());
        }
        validateQuestionOptions(req.options(), req.correctIndex());
        Question q = Question.builder()
                .skillId(req.skillId())
                .questionText(req.questionText().trim())
                .options(req.options().trim())
                .correctIndex(req.correctIndex())
                .build();
        return questions.save(q);
    }

    @Transactional
    public Question updateQuestion(Long id, AdminQuestionRequest req) {
        Question q = questions.findById(id).orElseThrow(() -> new NoSuchElementException("Question not found"));
        if (!skills.existsById(req.skillId())) {
            throw new NoSuchElementException("Skill not found for ID " + req.skillId());
        }
        validateQuestionOptions(req.options(), req.correctIndex());
        q.setSkillId(req.skillId());
        q.setQuestionText(req.questionText().trim());
        q.setOptions(req.options().trim());
        q.setCorrectIndex(req.correctIndex());
        return questions.save(q);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        if (!questions.existsById(id)) throw new NoSuchElementException("Question not found");
        questions.deleteById(id);
    }

    private void validateQuestionOptions(String options, int correctIndex) {
        String[] opts = options.split("\\|");
        if (opts.length < 2) {
            throw new IllegalArgumentException("Question must have at least 2 options separated by '|'");
        }
        if (correctIndex < 0 || correctIndex >= opts.length) {
            throw new IllegalArgumentException("Correct index must be between 0 and " + (opts.length - 1));
        }
    }

    // --- Resources CRUD ---

    public List<Resource> listResources(Long skillId) {
        return skillId == null ? resources.findAll() : resources.findBySkillId(skillId);
    }

    @Transactional
    public Resource createResource(AdminResourceRequest req) {
        if (!skills.existsById(req.skillId())) {
            throw new NoSuchElementException("Skill not found for ID " + req.skillId());
        }
        if (resources.existsByUrl(req.url())) {
            throw new IllegalArgumentException("Resource URL already exists: " + req.url());
        }
        Resource r = Resource.builder()
                .title(req.title().trim())
                .type(req.type().trim().toUpperCase())
                .url(req.url().trim())
                .skillId(req.skillId())
                .source(req.source() != null ? req.source().trim() : "Web")
                .rating(req.rating() != null ? req.rating() : 4.5)
                .tags(req.tags() != null ? req.tags().trim() : "")
                .build();
        return resources.save(r);
    }

    @Transactional
    public Resource updateResource(Long id, AdminResourceRequest req) {
        Resource r = resources.findById(id).orElseThrow(() -> new NoSuchElementException("Resource not found"));
        if (!skills.existsById(req.skillId())) {
            throw new NoSuchElementException("Skill not found for ID " + req.skillId());
        }
        if (!r.getUrl().equals(req.url()) && resources.existsByUrl(req.url())) {
            throw new IllegalArgumentException("Resource URL already exists: " + req.url());
        }
        r.setTitle(req.title().trim());
        r.setType(req.type().trim().toUpperCase());
        r.setUrl(req.url().trim());
        r.setSkillId(req.skillId());
        r.setSource(req.source() != null ? req.source().trim() : r.getSource());
        r.setRating(req.rating() != null ? req.rating() : r.getRating());
        r.setTags(req.tags() != null ? req.tags().trim() : r.getTags());
        return resources.save(r);
    }

    @Transactional
    public void deleteResource(Long id) {
        if (!resources.existsById(id)) throw new NoSuchElementException("Resource not found");
        if (userProgress.existsByResourceId(id)) {
            throw new IllegalStateException("Cannot delete resource: user progress is tracked for it");
        }
        if (feedback.existsByResourceId(id)) {
            throw new IllegalStateException("Cannot delete resource: user feedback is recorded for it");
        }
        if (notes.existsByResourceId(id)) {
            throw new IllegalStateException("Cannot delete resource: user notes exist for it");
        }
        resources.deleteById(id);
    }
}
