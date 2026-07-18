package com.connectneighbours.admindesktop.back.infrastructure.auth;

public record CachedCredential(
        String passwordHash,
        String displayName,
        String role
) {
}
