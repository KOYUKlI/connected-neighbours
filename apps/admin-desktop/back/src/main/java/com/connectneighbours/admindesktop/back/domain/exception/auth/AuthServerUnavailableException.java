package com.connectneighbours.admindesktop.back.domain.exception.auth;

public class AuthServerUnavailableException extends AuthenticationFailedException {
    public AuthServerUnavailableException(String message) {
        super(message);
    }
}
