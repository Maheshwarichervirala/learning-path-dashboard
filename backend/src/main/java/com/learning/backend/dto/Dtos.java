package com.learning.backend.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class Dtos {
    public record RegisterRequest(@NotBlank String name,
                                  @NotBlank @Email String email,
                                  @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record AuthResponse(String token, String name, String email) {}

    public record ProfileRequest(@NotBlank String domain, @NotBlank String careerGoal, String experienceLevel) {}

    public record QuestionView(Long id, String text, List<String> options) {}
    public record SubmitRequest(@NotNull Long skillId, @NotNull Map<Long, Integer> answers) {}
    public record SubmitResponse(double score, int correct, int total, String level, boolean passed) {}

    public record StepView(int order, Long skillId, String skillName, String status, double proficiency) {}
    public record PathView(Long pathId, String careerGoal, List<StepView> steps) {}

    public record CompleteRequest(@NotNull Long resourceId) {}

    public record ScorePoint(LocalDateTime takenAt, double score) {}
    public record DashboardSummary(int points, int streakDays, long resourcesCompleted,
                                   int stepsCompleted, int stepsTotal, double averageScore,
                                   List<ScorePoint> scoreTrend, List<String> badges) {}
    public record BadgeView(String code, String name, String description, boolean earned) {}
}