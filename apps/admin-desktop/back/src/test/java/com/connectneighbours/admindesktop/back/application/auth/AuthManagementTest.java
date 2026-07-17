package com.connectneighbours.admindesktop.back.application.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;
import com.connectneighbours.admindesktop.back.infrastructure.auth.SessionContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AuthManagementTest {

    private SessionContext sessionContext;
    private AuthClientFake authClient;
    private AuthManagement management;

    @BeforeEach
    void setup() {
        sessionContext = new SessionContext();
        authClient = new AuthClientFake(Map.of(
                "admin@connected-neighbours.local",
                new AuthenticatedSession("token-admin", "admin@connected-neighbours.local", "Admin Demo", "admin"),
                "resident@connected.local",
                new AuthenticatedSession("token-resident", "resident@connected.local", "Resident Demo", "resident")
        ));
        management = new AuthManagement(authClient, sessionContext);
    }

    @Test
    void login_shouldStoreSession_whenCredentialsAreAdmin() {
        var session = management.login("admin@connected-neighbours.local", "admin123");

        assertEquals("token-admin", session.accessToken());
        assertEquals(session, sessionContext.getCurrentSession());
        assertEquals("token-admin", sessionContext.getAccessToken());
    }

    @Test
    void login_shouldThrow_whenAccountIsNotAdmin() {
        assertThrows(AuthenticationFailedException.class,
                () -> management.login("resident@connected.local", "resident123"));

        assertNull(sessionContext.getCurrentSession());
    }

    @Test
    void login_shouldThrow_whenCredentialsAreInvalid() {
        assertThrows(AuthenticationFailedException.class,
                () -> management.login("unknown@connected.local", "wrong"));

        assertNull(sessionContext.getCurrentSession());
    }

    @Test
    void logout_shouldClearSession() {
        management.login("admin@connected-neighbours.local", "admin123");
        management.logout();

        assertNull(sessionContext.getCurrentSession());
        assertNull(management.getCurrentSession());
    }
}
