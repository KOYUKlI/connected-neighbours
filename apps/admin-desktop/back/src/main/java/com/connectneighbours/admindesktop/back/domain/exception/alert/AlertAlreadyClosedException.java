package com.connectneighbours.admindesktop.back.domain.exception.alert;

public class AlertAlreadyClosedException extends RuntimeException {
    public AlertAlreadyClosedException(String message) {
        super(message);
    }
}
