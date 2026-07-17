package com.connectneighbours.admindesktop.back.application.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthClient;
import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;

import java.util.Map;

public class AuthClientFake implements AuthClient {

    private final Map<String, AuthenticatedSession> sessionsByEmail;

    public AuthClientFake(Map<String, AuthenticatedSession> sessionsByEmail) {
        this.sessionsByEmail = sessionsByEmail;
    }

    @Override
    public AuthenticatedSession login(String email, String password) {
        var session = sessionsByEmail.get(email);

        if (session == null) {
            throw new AuthenticationFailedException("Invalid credentials");
        }

        return session;
    }
}
