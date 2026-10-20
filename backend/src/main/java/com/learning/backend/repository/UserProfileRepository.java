package com.learning.backend.repository;

import com.learning.backend.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

}
