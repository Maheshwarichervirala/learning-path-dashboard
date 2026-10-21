package com.learning.backend.repository;

import com.learning.backend.entity.ResourceFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ResourceFeedbackRepository extends JpaRepository<ResourceFeedback, Long> {
    Optional<ResourceFeedback> findByUserIdAndResourceId(Long userId, Long resourceId);
    List<ResourceFeedback> findByUserId(Long userId);
    void deleteByUserIdAndResourceId(Long userId, Long resourceId);
    boolean existsByResourceId(Long resourceId);
}
