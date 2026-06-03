package com.connectneighbours.admindesktop.back.application.incident.service;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

public record UpdateIncidentDTO(
        String title,
        String description,
        IncidentType type
) {}

