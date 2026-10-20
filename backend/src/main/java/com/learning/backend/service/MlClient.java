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

    @SuppressWarnings("unchecked")
    public Optional<List<Long>> recommend(Long userId, List<Long> candidateIds) {
        try {
            Map<String, Object> res = rest.post().uri("/recommend")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("user_id", userId, "candidate_ids", candidateIds))
                    .retrieve().body(Map.class);
            List<Number> ids = (List<Number>) res.get("ranked_ids");
            return Optional.of(ids.stream().map(Number::longValue).toList());
        } catch (Exception e) {
            log.warn("ML service unavailable, using fallback ranking: {}", e.getMessage());
            return Optional.empty();
        }
    }
}