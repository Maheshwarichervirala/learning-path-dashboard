package com.learning.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String mailHost;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                        @Value("${spring.mail.host:}") String mailHost) {
        this.mailSenderProvider = mailSenderProvider;
        this.mailHost = mailHost;
    }

    public void sendPasswordResetEmail(String to, String resetUrl) {
        if (mailHost == null || mailHost.isBlank()) {
            log.info("==================================================================");
            log.info("[DEV MODE] SMTP is not configured. Reset link for {}: {}", to, resetUrl);
            log.info("==================================================================");
            return;
        }

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.info("[DEV MODE] JavaMailSender unavailable. Reset link for {}: {}", to, resetUrl);
            return;
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("Reset Your Password - Learning Path Dashboard");
            msg.setText("Hello,\n\nYou requested a password reset. Click the link below to set a new password:\n\n"
                    + resetUrl + "\n\nThis link will expire in 30 minutes.\nIf you did not request this, please ignore this email.");
            sender.send(msg);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}. Logging reset link: {}", to, e.getMessage(), resetUrl);
        }
    }
}
