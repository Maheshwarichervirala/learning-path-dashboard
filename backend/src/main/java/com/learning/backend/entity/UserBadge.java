package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "user_badges")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserBadge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    private Long badgeId;
    private LocalDateTime awardedAt;

    @PrePersist
    void onCreate() { awardedAt = LocalDateTime.now(); }
}
