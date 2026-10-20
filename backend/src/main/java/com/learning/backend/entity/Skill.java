package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "skills")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Skill {
    @Id private Long id;
    private String name;
    private String domain;
    private Integer difficulty;
    private Long prerequisiteSkillId;
}
