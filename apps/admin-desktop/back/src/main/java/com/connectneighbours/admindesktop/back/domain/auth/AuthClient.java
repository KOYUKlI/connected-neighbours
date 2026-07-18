package com.connectneighbours.admindesktop.back.domain.auth;

public interface AuthClient {
    AuthenticatedSession login(String email, String password);

    AuthenticatedSession exchangeSsoCode(String code, String codeVerifier);
}
