package com.connectneighbours.admindesktop.back.domain.exception.auth;

public class AuthenticationFailedException extends RuntimeException {
    public AuthenticationFailedException(String message) {
        super(message);
    }
}
