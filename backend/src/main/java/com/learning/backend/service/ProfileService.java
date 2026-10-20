package com.learning.backend.service;

import com.learning.backend.dto.Dtos.ProfileRequest;
import com.learning.backend.entity.UserProfile;
import com.learning.backend.repository.UserProfileRepository;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserProfileRepository profiles;
    private final CurrentUser current;

    public UserProfile get() {
        return profiles.findById(current.id())
                .orElseThrow(() -> new NoSuchElementException("Profile not set up yet"));
    }

    public UserProfile save(ProfileRequest r) {
        return profiles.save(new UserProfile(current.id(), r.domain(), r.careerGoal(), r.experienceLevel()));
    }
}