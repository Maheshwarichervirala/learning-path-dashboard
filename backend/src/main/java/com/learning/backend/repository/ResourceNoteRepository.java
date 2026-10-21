package com.learning.backend.repository;

import com.learning.backend.entity.ResourceNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ResourceNoteRepository extends JpaRepository<ResourceNote, Long> {
    Optional<ResourceNote> findByUserIdAndResourceId(Long userId, Long resourceId);
    boolean existsByResourceId(Long resourceId);
}
