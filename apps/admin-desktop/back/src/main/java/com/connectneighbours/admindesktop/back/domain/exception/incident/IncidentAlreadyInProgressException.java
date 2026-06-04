package com.connectneighbours.admindesktop.back.domain.exception.incident;

public class IncidentAlreadyInProgressException extends RuntimeException {
    public IncidentAlreadyInProgressException(String message) {
        super(message);
    }
}
