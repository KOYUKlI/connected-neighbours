package com.connectneighbours.admindesktop.back.domain.exception;

public class IncidentDeletionNotAllowedException extends RuntimeException {
    public IncidentDeletionNotAllowedException(String message) {
        super(message);
    }
}
