package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "user_profiles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {
    @Id private Long userId;
    private String domain;
    private String careerGoal;
    private String experienceLevel;
}
