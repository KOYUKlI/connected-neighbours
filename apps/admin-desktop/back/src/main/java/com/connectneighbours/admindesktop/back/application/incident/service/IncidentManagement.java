package com.connectneighbours.admindesktop.back.application.incident.service;

import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertService;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentService;

public class IncidentManagement {
    private AlertRepository alertRepository;
    private IncidentRepository incidentRepository;
    private AlertService alertService;
    private IncidentService incidentService;

    public IncidentManagement(AlertRepository alertRepository, IncidentRepository incidentRepository, AlertService alertService, IncidentService incidentService) {
        this.alertRepository = alertRepository;
        this.incidentRepository = incidentRepository;
        this.alertService = alertService;
        this.incidentService = incidentService;
    }
}
