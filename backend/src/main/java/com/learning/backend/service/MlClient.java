package com.learning.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.*;

@Service
@Slf4j
public class MlClient {
    private final RestClient rest;

    public MlClient(@Value("${ml.base-url}") String baseUrl) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(3000);
        this.rest = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public record ClassifiedLevel(String level, Double confidence) {}

    public Optional<List<Long>> recommend(Long userId, List<Long> candidateIds) {
        return recommend(userId, candidateIds, List.of(), null);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Long>> recommend(Long userId, List<Long> candidateIds, List<Long> completedIds, Integer preferredDifficulty) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("user_id", userId);
            req.put("candidate_ids", candidateIds);
            req.put("completed_ids", completedIds != null ? completedIds : List.of());
            if (preferredDifficulty != null) {
                req.put("preferred_difficulty", preferredDifficulty);
            }
            Map<String, Object> res = rest.post().uri("/recommend")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve().body(Map.class);
            List<Number> ids = (List<Number>) res.get("ranked_ids");
            return Optional.of(ids.stream().map(Number::longValue).toList());
        } catch (Exception e) {
            log.warn("ML service unavailable, using fallback ranking: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<ClassifiedLevel> classifyLevel(double avgScore, double lastScore, int quizzesTaken) {
        try {
            Map<String, Object> req = Map.of(
                    "avg_score", avgScore,
                    "last_score", lastScore,
                    "quizzes_taken", quizzesTaken
            );
            Map<String, Object> res = rest.post().uri("/classify-level")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve().body(Map.class);
            if (res != null && res.containsKey("level")) {
                String level = (String) res.get("level");
                Double conf = res.get("confidence") instanceof Number n ? n.doubleValue() : null;
                return Optional.of(new ClassifiedLevel(level, conf));
            }
            return Optional.empty();
        } catch (Exception e) {
            log.warn("ML service unavailable, cannot classify level: {}", e.getMessage());
            return Optional.empty();
        }
    }
}