package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "user_skills")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSkill {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    private Long skillId;
    private Double proficiencyScore;
}
