package com.connectneighbours.admindesktop.back.domain.exception.incident;

public class IncidentDeletionNotAllowedException extends RuntimeException {
    public IncidentDeletionNotAllowedException(String message) {
        super(message);
    }
}
