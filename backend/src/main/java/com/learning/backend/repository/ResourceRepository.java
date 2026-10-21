package com.learning.backend.repository;

import com.learning.backend.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findBySkillId(Long skillId);
    boolean existsByUrl(String url);
    boolean existsBySkillId(Long skillId);
}
