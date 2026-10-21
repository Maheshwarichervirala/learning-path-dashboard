package com.learning.backend.service;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class RateLimiterService {
    private final Map<String, CopyOnWriteArrayList<Instant>> requestLog = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 5;
    private static final long WINDOW_SECONDS = 900; // 15 minutes

    public boolean tryAcquire(String key) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        requestLog.compute(key, (k, list) -> {
            if (list == null) list = new CopyOnWriteArrayList<>();
            list.removeIf(instant -> instant.isBefore(cutoff));
            return list;
        });

        CopyOnWriteArrayList<Instant> list = requestLog.get(key);
        if (list != null && list.size() >= MAX_REQUESTS) {
            return false;
        }

        if (list != null) {
            list.add(now);
        }
        return true;
    }
}
