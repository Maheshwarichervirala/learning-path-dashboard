package com.learning.backend.service;

import com.learning.backend.dto.Dtos.*;
import com.learning.backend.entity.PasswordResetToken;
import com.learning.backend.entity.User;
import com.learning.backend.entity.UserStats;
import com.learning.backend.repository.PasswordResetTokenRepository;
import com.learning.backend.repository.UserRepository;
import com.learning.backend.repository.UserStatsRepository;
import com.learning.backend.security.CurrentUser;
import com.learning.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final UserStatsRepository stats;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwt;
    private final CurrentUser current;
    private final PasswordResetTokenRepository resetTokens;
    private final EmailService emailService;
    private final RateLimiterService rateLimiter;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        String email = r.email().toLowerCase();
        if (users.existsByEmail(email)) throw new IllegalArgumentException("Email already registered");
        User u = users.save(User.builder().name(r.name()).email(email)
                .passwordHash(encoder.encode(r.password())).build());
        stats.save(new UserStats(u.getId(), 0, 0, null));
        return new AuthResponse(jwt.generate(email), u.getName(), email, u.getRole());
    }

    public AuthResponse login(LoginRequest r) {
        String email = r.email().toLowerCase();
        authManager.authenticate(new UsernamePasswordAuthenticationToken(email, r.password()));
        User u = users.findByEmail(email).orElseThrow();
        return new AuthResponse(jwt.generate(email), u.getName(), email, u.getRole());
    }

    public UserView getMe() {
        Long uid = current.id();
        User u = users.findById(uid).orElseThrow();
        return new UserView(u.getId(), u.getName(), u.getEmail(), u.getRole());
    }

    @Transactional
    public Map<String, String> changePassword(ChangePasswordRequest r) {
        Long uid = current.id();
        User u = users.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (!encoder.matches(r.currentPassword(), u.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        u.setPasswordHash(encoder.encode(r.newPassword()));
        users.save(u);
        return Map.of("message", "Password changed successfully");
    }

    @Transactional
    public Map<String, String> forgotPassword(ForgotPasswordRequest r, String clientIp) {
        if (!rateLimiter.tryAcquire("forgot:" + clientIp)) {
            throw new IllegalStateException("Too many password reset requests. Please try again later.");
        }
        String genericMsg = "If an account with that email exists, password reset instructions have been sent.";
        String email = r.email().toLowerCase().trim();
        users.findByEmail(email).ifPresent(u -> {
            String rawToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
            String tokenHash = hashToken(rawToken);
            resetTokens.save(PasswordResetToken.builder()
                    .userId(u.getId())
                    .tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .used(false)
                    .build());
            String resetUrl = frontendUrl + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(email, resetUrl);
        });
        return Map.of("message", genericMsg);
    }

    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest r, String clientIp) {
        if (!rateLimiter.tryAcquire("reset:" + clientIp)) {
            throw new IllegalStateException("Too many attempts. Please try again later.");
        }
        String tokenHash = hashToken(r.token().trim());
        PasswordResetToken token = resetTokens.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }

        User u = users.findById(token.getUserId())
                .orElseThrow(() -> new IllegalStateException("User account not found"));

        token.setUsed(true);
        resetTokens.save(token);

        u.setPasswordHash(encoder.encode(r.newPassword()));
        users.save(u);

        return Map.of("message", "Password has been successfully reset. You may now log in.");
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}