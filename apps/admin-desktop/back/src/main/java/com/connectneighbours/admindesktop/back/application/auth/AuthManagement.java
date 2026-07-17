package com.connectneighbours.admindesktop.back.application.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthClient;
import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;
import com.connectneighbours.admindesktop.back.infrastructure.auth.SessionContext;
import org.springframework.stereotype.Service;

@Service
public class AuthManagement {

    private final AuthClient authClient;
    private final SessionContext sessionContext;

    public AuthManagement(AuthClient authClient, SessionContext sessionContext) {
        this.authClient = authClient;
        this.sessionContext = sessionContext;
    }

    public AuthenticatedSession login(String email, String password) {
        var session = authClient.login(email, password);

        if (!session.isAdmin()) {
            throw new AuthenticationFailedException("This account does not have the admin role");
        }

        sessionContext.setCurrentSession(session);
        return session;
    }

    public void logout() {
        sessionContext.clear();
    }

    public AuthenticatedSession getCurrentSession() {
        return sessionContext.getCurrentSession();
    }
}
