package com.learning.backend.service;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.entity.User;
import com.learning.backend.entity.UserStats;
import com.learning.backend.repository.UserRepository;
import com.learning.backend.repository.UserStatsRepository;
import com.learning.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final UserStatsRepository stats;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwt;

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        String email = r.email().toLowerCase();
        if (users.existsByEmail(email)) throw new IllegalArgumentException("Email already registered");
        User u = users.save(User.builder().name(r.name()).email(email)
                .passwordHash(encoder.encode(r.password())).build());
        stats.save(new UserStats(u.getId(), 0, 0, null));
        return new AuthResponse(jwt.generate(email), u.getName(), email);
    }

    public AuthResponse login(LoginRequest r) {
        String email = r.email().toLowerCase();
        authManager.authenticate(new UsernamePasswordAuthenticationToken(email, r.password()));
        User u = users.findByEmail(email).orElseThrow();
        return new AuthResponse(jwt.generate(email), u.getName(), email);
    }
}