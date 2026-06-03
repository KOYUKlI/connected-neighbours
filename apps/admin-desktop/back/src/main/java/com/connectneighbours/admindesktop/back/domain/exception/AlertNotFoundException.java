package com.connectneighbours.admindesktop.back.domain.exception;

public class AlertNotFoundException extends RuntimeException {
    public AlertNotFoundException(String message) {
        super("Alert not found with ID : "+message);
    }
}
