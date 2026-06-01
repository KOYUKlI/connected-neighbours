package com.connectneighbours.admindesktop.back.domain.exception;

public class IncidentAlreadyInProgressException extends RuntimeException {
    public IncidentAlreadyInProgressException(String message) {
        super(message);
    }
}
