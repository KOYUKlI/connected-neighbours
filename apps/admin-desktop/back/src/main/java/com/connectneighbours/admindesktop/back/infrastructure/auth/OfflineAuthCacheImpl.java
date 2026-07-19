package com.connectneighbours.admindesktop.back.infrastructure.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class OfflineAuthCacheImpl implements OfflineAuthCache {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    protected final Map<String, CachedCredential> data = new HashMap<>();

    @Override
    public void remember(String email, String password, String displayName, String role) {
        data.put(key(email), new CachedCredential(encoder.encode(password), displayName, role));
    }

    @Override
    public Optional<AuthenticatedSession> tryOfflineLogin(String email, String password) {
        var cached = data.get(key(email));

        if (cached == null || !encoder.matches(password, cached.passwordHash())) {
            return Optional.empty();
        }

        return Optional.of(new AuthenticatedSession(null, email, cached.displayName(), cached.role(), true));
    }

    private String key(String email) {
        return email.toLowerCase();
    }
}
