package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "path_steps")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PathStep {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long pathId;
    private Integer stepOrder;
    private Long skillId;
    private String status;
}
