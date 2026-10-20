package com.learning.backend.repository;

import com.learning.backend.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import org.springframework.data.jpa.repository.Query;
public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findByDomain(String domain);
    @Query("select distinct s.domain from Skill s order by s.domain")
    List<String> findDomains();
}
