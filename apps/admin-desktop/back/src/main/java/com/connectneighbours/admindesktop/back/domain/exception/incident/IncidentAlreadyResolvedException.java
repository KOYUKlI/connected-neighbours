package com.connectneighbours.admindesktop.back.domain.exception.incident;

public class IncidentAlreadyResolvedException extends RuntimeException {
    public IncidentAlreadyResolvedException(String message) {
        super(message);
    }
}
