package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.ProfileRequest;
import com.learning.backend.entity.UserProfile;
import com.learning.backend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profiles;

    @GetMapping
    public UserProfile get() { return profiles.get(); }

    @PutMapping
    public UserProfile save(@Valid @RequestBody ProfileRequest r) { return profiles.save(r); }
}