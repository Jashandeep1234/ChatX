package com.chat.Backend.service;

import com.chat.Backend.exception.RateLimitException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/** Per-user token buckets. Throws RateLimitException (mapped to 429) when empty. */
@Service
public class RateLimitService {

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public void checkMessages(java.util.UUID userId) {
        check("msg:" + userId, 60, Duration.ofMinutes(1));
    }

    public void checkUploads(java.util.UUID userId) {
        check("upl:" + userId, 20, Duration.ofMinutes(1));
    }

    private void check(String key, long capacity, Duration per) {
        Bucket b = buckets.computeIfAbsent(key,
                k -> Bucket.builder().addLimit(Bandwidth.classic(capacity, Refill.greedy(capacity, per))).build());
        if (!b.tryConsume(1)) {
            throw new RateLimitException("Rate limit exceeded, try again later");
        }
    }
}
