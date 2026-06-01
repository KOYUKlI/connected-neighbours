package com.connectneighbours.admindesktop.back.domain.exception;

public class IncidentHasCriticalAlertsException extends RuntimeException {
    public IncidentHasCriticalAlertsException(String message) {
        super(message);
    }
}
