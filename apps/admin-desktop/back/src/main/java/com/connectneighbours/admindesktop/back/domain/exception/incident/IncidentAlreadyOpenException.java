package com.connectneighbours.admindesktop.back.domain.exception.incident;

public class IncidentAlreadyOpenException extends RuntimeException {
    public IncidentAlreadyOpenException(String message) {
        super(message);
    }
}
