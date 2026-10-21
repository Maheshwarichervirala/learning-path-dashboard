package com.learning.backend.service;

import com.learning.backend.dto.Dtos.FeedbackRequest;
import com.learning.backend.dto.Dtos.FeedbackView;
import com.learning.backend.entity.ResourceFeedback;
import com.learning.backend.repository.ResourceFeedbackRepository;
import com.learning.backend.repository.ResourceRepository;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ResourceFeedbackService {
    private final ResourceFeedbackRepository feedbackRepo;
    private final ResourceRepository resourceRepo;
    private final CurrentUser current;

    @Transactional
    public FeedbackView saveFeedback(FeedbackRequest request) {
        if (request.value() == null || (request.value() != 1 && request.value() != -1)) {
            throw new IllegalArgumentException("Feedback value must be 1 (like) or -1 (dislike)");
        }
        resourceRepo.findById(request.resourceId())
                .orElseThrow(() -> new NoSuchElementException("Resource not found"));

        Long userId = current.id();
        ResourceFeedback feedback = feedbackRepo.findByUserIdAndResourceId(userId, request.resourceId())
                .map(existing -> {
                    existing.setValue(request.value());
                    return existing;
                })
                .orElseGet(() -> ResourceFeedback.builder()
                        .userId(userId)
                        .resourceId(request.resourceId())
                        .value(request.value())
                        .build());

        ResourceFeedback saved = feedbackRepo.save(feedback);
        return new FeedbackView(saved.getResourceId(), saved.getValue());
    }

    public List<FeedbackView> getMyFeedback() {
        Long userId = current.id();
        return feedbackRepo.findByUserId(userId).stream()
                .map(f -> new FeedbackView(f.getResourceId(), f.getValue()))
                .toList();
    }
}
