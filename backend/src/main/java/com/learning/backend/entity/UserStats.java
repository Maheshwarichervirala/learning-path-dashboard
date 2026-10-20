package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
@Entity @Table(name = "user_stats")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserStats {
    @Id private Long userId;
    private Integer points;
    private Integer streakDays;
    private LocalDate lastActiveDate;
}
