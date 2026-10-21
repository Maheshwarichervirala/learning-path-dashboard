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
    public record AuthResponse(String token, String name, String email, String role) {}

    public record ProfileRequest(@NotBlank String domain, @NotBlank String careerGoal, String experienceLevel) {}

    public record QuestionView(Long id, String text, List<String> options) {}
    public record SubmitRequest(@NotNull Long skillId, @NotNull Map<Long, Integer> answers) {}
    public record SubmitResponse(double score, int correct, int total, String level, boolean passed) {}
    public record LevelView(String level, Double confidence) {}
    public record AttemptHistoryView(double score, int correct, int total, LocalDateTime takenAt) {}

    public record StepView(int order, Long skillId, String skillName, String status, double proficiency) {}
    public record PathView(Long pathId, String careerGoal, List<StepView> steps) {}

    public record CompleteRequest(@NotNull Long resourceId) {}
    public record ProgressStatusRequest(@NotNull Long resourceId, @NotBlank String status) {}
    public record ProgressStateView(Long resourceId, String status, LocalDateTime completedAt) {}

    public record ScorePoint(LocalDateTime takenAt, double score) {}
    public record DashboardSummary(int points, int streakDays, long resourcesCompleted,
                                   int stepsCompleted, int stepsTotal, double averageScore,
                                   List<ScorePoint> scoreTrend, List<String> badges) {}
    public record BadgeView(String code, String name, String description, boolean earned) {}

    public record FeedbackRequest(
            @NotNull(message = "Resource ID is required") Long resourceId,
            @NotNull(message = "Feedback value is required") @Min(value = -1, message = "Value must be -1 or 1") @Max(value = 1, message = "Value must be -1 or 1") Integer value) {}
    public record FeedbackView(Long resourceId, int value) {}

    public record LeaderboardEntry(String name, int points) {}
    public record UserRankView(int rank, int points, String name) {}

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Size(min = 8, message = "New password must be at least 8 characters") String newPassword) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(@NotBlank String token,
                                       @NotBlank @Size(min = 8, message = "New password must be at least 8 characters") String newPassword) {}

    public record UserView(Long id, String name, String email, String role) {}

    public record GoalRequest(@NotNull @Min(1) @Max(5) Integer target) {}
    public record GoalView(int target, int completedToday, boolean met) {}

    public record NoteRequest(@NotNull Long resourceId, @NotNull @Size(max = 2000, message = "Note cannot exceed 2000 characters") String text) {}
    public record NoteView(Long resourceId, String text, LocalDateTime updatedAt) {}

    public record WeeklyStats(int resourcesCompleted, int quizzesTaken, int pointsEarned, double bestScore, int streak) {}
    public record WeeklyView(WeeklyStats thisWeek, WeeklyStats lastWeek) {}

    public record AdminSkillRequest(Long id, @NotBlank String name, @NotBlank String domain, @NotNull @Min(1) @Max(5) Integer difficulty, Long prerequisiteSkillId) {}
    public record AdminQuestionRequest(Long id, @NotNull Long skillId, @NotBlank String questionText, @NotBlank String options, @NotNull Integer correctIndex) {}
    public record AdminResourceRequest(Long id, @NotBlank String title, @NotBlank String type, @NotBlank String url, @NotNull Long skillId, String source, Double rating, String tags) {}
}