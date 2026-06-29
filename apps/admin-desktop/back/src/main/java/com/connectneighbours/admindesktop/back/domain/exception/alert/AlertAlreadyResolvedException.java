package com.connectneighbours.admindesktop.back.domain.exception.alert;

public class AlertAlreadyResolvedException extends RuntimeException {
    public AlertAlreadyResolvedException(String message) {
        super(message);
    }
}
