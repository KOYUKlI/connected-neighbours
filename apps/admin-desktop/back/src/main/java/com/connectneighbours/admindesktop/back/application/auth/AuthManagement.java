package com.connectneighbours.admindesktop.back.application.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthClient;
import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthServerUnavailableException;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;
import com.connectneighbours.admindesktop.back.infrastructure.auth.OfflineAuthCache;
import com.connectneighbours.admindesktop.back.infrastructure.auth.SessionContext;
import org.springframework.stereotype.Service;

@Service
public class AuthManagement {

    private final AuthClient authClient;
    private final SessionContext sessionContext;
    private final OfflineAuthCache offlineAuthCache;

    public AuthManagement(AuthClient authClient, SessionContext sessionContext, OfflineAuthCache offlineAuthCache) {
        this.authClient = authClient;
        this.sessionContext = sessionContext;
        this.offlineAuthCache = offlineAuthCache;
    }

    public AuthenticatedSession login(String email, String password) {
        AuthenticatedSession session;

        try {
            session = authClient.login(email, password);
        } catch (AuthServerUnavailableException e) {
            session = offlineAuthCache.tryOfflineLogin(email, password).orElseThrow(() -> e);
            sessionContext.setCurrentSession(session);
            return session;
        }

        if (!session.isAdmin()) {
            throw new AuthenticationFailedException("This account does not have the admin role");
        }

        offlineAuthCache.remember(email, password, session.displayName(), session.role());
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
