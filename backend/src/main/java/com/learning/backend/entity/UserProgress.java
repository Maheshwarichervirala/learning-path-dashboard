package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "user_progress")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProgress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    private Long resourceId;
    private String status;
    private LocalDateTime completedAt;
}
