package com.connectneighbours.admindesktop.back.application.incident.service;

import com.connectneighbours.admindesktop.back.application.incident.service.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;

import java.util.List;
import java.util.UUID;

public record IncidentDTO(
        UUID id,
        Reporter reporter,
        String title,
        String description,
        IncidentType type,
        IncidentStatus status,
        List<AlertDTO> alerts
) {}

