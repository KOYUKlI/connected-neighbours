package com.connectneighbours.admindesktop.back.domain.exception.alert;

public class AlertAlreadyInProgressException extends RuntimeException {
    public AlertAlreadyInProgressException(String message) {
        super(message);
    }
}
