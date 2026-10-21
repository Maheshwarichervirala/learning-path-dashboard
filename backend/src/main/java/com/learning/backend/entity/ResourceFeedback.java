package com.learning.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resource_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long resourceId;
    private Integer value;
}
