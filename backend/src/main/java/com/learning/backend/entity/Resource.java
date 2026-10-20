package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "resources")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Resource {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title;
    private String type;
    @Column(unique = true) private String url;
    private Long skillId;
    private String source;
    private Double rating;
    private String tags;
}
