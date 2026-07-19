package com.connectneighbours.admindesktop.back.infrastructure.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import org.springframework.stereotype.Service;

@Service
public class SessionContext {

    private AuthenticatedSession currentSession;

    public void setCurrentSession(AuthenticatedSession session) {
        this.currentSession = session;
    }

    public AuthenticatedSession getCurrentSession() {
        return currentSession;
    }

    public String getAccessToken() {
        return currentSession != null ? currentSession.accessToken() : null;
    }

    public void clear() {
        currentSession = null;
    }
}
