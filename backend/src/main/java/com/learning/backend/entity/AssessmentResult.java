package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "assessment_results")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AssessmentResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    private Long skillId;
    private Double score;
    private LocalDateTime takenAt;

    @PrePersist
    void onCreate() { takenAt = LocalDateTime.now(); }
}
