package com.connectneighbours.admindesktop.back.infrastructure.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OfflineAuthCacheImplTest {

    private OfflineAuthCacheImpl cache;

    @BeforeEach
    void setup() {
        cache = new OfflineAuthCacheImpl();
    }

    @Test
    void tryOfflineLogin_shouldSucceed_whenCredentialsMatch() {
        cache.remember("john@example.com", "password123", "John Doe", "resident");

        var session = cache.tryOfflineLogin("john@example.com", "password123");

        assertTrue(session.isPresent());
        assertEquals("john@example.com", session.get().email());
        assertEquals("John Doe", session.get().displayName());
        assertEquals("resident", session.get().role());
        assertTrue(session.get().offline());
        assertNull(session.get().accessToken());
    }

    @Test
    void tryOfflineLogin_shouldFail_whenPasswordIsWrong() {
        cache.remember("john@example.com", "password123", "John Doe", "resident");

        var session = cache.tryOfflineLogin("john@example.com", "wrong-password");

        assertTrue(session.isEmpty());
    }

    @Test
    void tryOfflineLogin_shouldFail_whenEmailIsUnknown() {
        var session = cache.tryOfflineLogin("unknown@example.com", "password123");

        assertTrue(session.isEmpty());
    }

    @Test
    void tryOfflineLogin_shouldBeCaseInsensitive_onEmail() {
        cache.remember("John@Example.com", "password123", "John Doe", "resident");

        var session = cache.tryOfflineLogin("john@example.com", "password123");

        assertTrue(session.isPresent());
    }

    @Test
    void remember_shouldOverridePreviousCredential_forSameEmail() {
        cache.remember("john@example.com", "old-password", "John Doe", "resident");
        cache.remember("john@example.com", "new-password", "John Doe", "resident");

        assertTrue(cache.tryOfflineLogin("john@example.com", "old-password").isEmpty());
        assertTrue(cache.tryOfflineLogin("john@example.com", "new-password").isPresent());
    }
}
