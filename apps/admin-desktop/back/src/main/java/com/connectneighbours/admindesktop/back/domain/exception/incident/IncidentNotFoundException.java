package com.connectneighbours.admindesktop.back.domain.exception.incident;

public class IncidentNotFoundException extends RuntimeException {
    public IncidentNotFoundException(String message) {
        super("Incident not found with ID : "+message);
    }
}
