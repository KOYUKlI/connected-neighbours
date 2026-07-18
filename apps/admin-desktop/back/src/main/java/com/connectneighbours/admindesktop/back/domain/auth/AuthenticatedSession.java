package com.connectneighbours.admindesktop.back.domain.auth;

public record AuthenticatedSession(
        String accessToken,
        String email,
        String displayName,
        String role,
        boolean offline
) {
    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }
}
