package com.learning.backend.repository;

import com.learning.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySkillId(Long skillId);
}
