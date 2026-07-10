package com.connectneighbours.admindesktop.back.domain.exception.incident;

public class IncidentAlreadyClosedException extends RuntimeException {
    public IncidentAlreadyClosedException(String message) {
        super(message);
    }
}
