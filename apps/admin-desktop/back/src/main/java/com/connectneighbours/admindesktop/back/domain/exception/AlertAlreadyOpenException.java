package com.connectneighbours.admindesktop.back.domain.exception;

public class AlertAlreadyOpenException extends RuntimeException {
    public AlertAlreadyOpenException(String message) {
        super(message);
    }
}
