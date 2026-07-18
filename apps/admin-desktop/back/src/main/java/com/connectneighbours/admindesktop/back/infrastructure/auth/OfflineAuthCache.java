package com.connectneighbours.admindesktop.back.infrastructure.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;

import java.util.Optional;

public interface OfflineAuthCache {
    void remember(String email, String password, String displayName, String role);

    Optional<AuthenticatedSession> tryOfflineLogin(String email, String password);
}
