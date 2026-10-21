package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.FeedbackRequest;
import com.learning.backend.dto.Dtos.FeedbackView;
import com.learning.backend.service.ResourceFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    private final ResourceFeedbackService feedbackService;

    @PostMapping
    public FeedbackView submitFeedback(@Valid @RequestBody FeedbackRequest req) {
        return feedbackService.saveFeedback(req);
    }

    @GetMapping
    public List<FeedbackView> getMyFeedback() {
        return feedbackService.getMyFeedback();
    }
}
