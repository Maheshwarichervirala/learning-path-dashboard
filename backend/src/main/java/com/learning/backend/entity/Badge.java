package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "badges")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Badge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String code;
    private String name;
    private String description;
}
