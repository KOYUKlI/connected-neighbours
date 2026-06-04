package com.connectneighbours.admindesktop.back.domain.exception.alert;

public class AlertAlreadyOpenException extends RuntimeException {
    public AlertAlreadyOpenException(String message) {
        super(message);
    }
}
