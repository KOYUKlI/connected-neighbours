package com.connectneighbours.admindesktop.back.application.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthClient;
import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthServerUnavailableException;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;

import java.util.Map;

public class AuthClientFake implements AuthClient {

    private final Map<String, AuthenticatedSession> sessionsByEmail;
    private boolean unavailable = false;

    public AuthClientFake(Map<String, AuthenticatedSession> sessionsByEmail) {
        this.sessionsByEmail = sessionsByEmail;
    }

    public void setUnavailable(boolean unavailable) {
        this.unavailable = unavailable;
    }

    @Override
    public AuthenticatedSession login(String email, String password) {
        if (unavailable) {
            throw new AuthServerUnavailableException("Unable to reach the central server");
        }

        var session = sessionsByEmail.get(email);

        if (session == null) {
            throw new AuthenticationFailedException("Invalid credentials");
        }

        return session;
    }

    @Override
    public AuthenticatedSession exchangeSsoCode(String code, String codeVerifier) {
        if (unavailable) {
            throw new AuthServerUnavailableException("Unable to reach the central server");
        }

        throw new AuthenticationFailedException("Invalid or expired SSO code");
    }
}
