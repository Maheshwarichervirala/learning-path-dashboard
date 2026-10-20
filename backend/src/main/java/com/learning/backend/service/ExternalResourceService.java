package com.learning.backend.service;

import com.learning.backend.entity.Resource;
import com.learning.backend.entity.Skill;
import com.learning.backend.repository.ResourceRepository;
import com.learning.backend.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalResourceService {
    private final SkillRepository skills;
    private final ResourceRepository resources;
    private final RestClient rest = RestClient.create();
    @Value("${youtube.api.key:}") private String youtubeKey;
    @Value("${github.api.token:}") private String githubToken;

    @Transactional
    public int importFor(Long skillId) {
        Skill s = skills.findById(skillId).orElseThrow(() -> new NoSuchElementException("Skill not found"));
        return importYoutube(s) + importGithub(s);
    }

    @SuppressWarnings("unchecked")
    private int importYoutube(Skill s) {
        if (youtubeKey == null || youtubeKey.isBlank()) return 0;
        try {
            Map<String, Object> res = rest.get().uri(
                "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q={q}&key={k}",
                s.getName() + " tutorial", youtubeKey).retrieve().body(Map.class);
            int added = 0;
            for (Map<String, Object> item : (List<Map<String, Object>>) res.get("items")) {
                String videoId = (String) ((Map<String, Object>) item.get("id")).get("videoId");
                String title = (String) ((Map<String, Object>) item.get("snippet")).get("title");
                if (videoId == null) continue;
                String url = "https://www.youtube.com/watch?v=" + videoId;
                if (!resources.existsByUrl(url)) {
                    resources.save(Resource.builder().title(title).type("VIDEO").url(url)
                            .skillId(s.getId()).source("YOUTUBE").rating(4.0).tags(s.getName()).build());
                    added++;
                }
            }
            return added;
        } catch (Exception e) {
            log.warn("YouTube import failed: {}", e.getMessage());
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private int importGithub(Skill s) {
        try {
            Map<String, Object> res = rest.get().uri(
                "https://api.github.com/search/repositories?q={q}&sort=stars&per_page=5", s.getName() + " tutorial")
                .headers(h -> {
                    h.set("Accept", "application/vnd.github+json");
                    if (githubToken != null && !githubToken.isBlank()) h.setBearerAuth(githubToken);
                }).retrieve().body(Map.class);
            int added = 0;
            for (Map<String, Object> repo : (List<Map<String, Object>>) res.get("items")) {
                String url = (String) repo.get("html_url");
                double stars = ((Number) repo.get("stargazers_count")).doubleValue();
                if (!resources.existsByUrl(url)) {
                    resources.save(Resource.builder().title((String) repo.get("full_name")).type("PROJECT")
                            .url(url).skillId(s.getId()).source("GITHUB")
                            .rating(Math.min(5.0, Math.log10(stars + 1))).tags(s.getName()).build());
                    added++;
                }
            }
            return added;
        } catch (Exception e) {
            log.warn("GitHub import failed: {}", e.getMessage());
            return 0;
        }
    }
}