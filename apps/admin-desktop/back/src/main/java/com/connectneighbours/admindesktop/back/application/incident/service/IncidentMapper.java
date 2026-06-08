package com.connectneighbours.admindesktop.back.application.incident.service;

import com.connectneighbours.admindesktop.back.application.incident.service.alert.AlertMapper;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;

public class IncidentMapper {
    public static IncidentDTO toDTO(Incident incident) {
        return new IncidentDTO(
                incident.getIncidentId(),
                incident.getReporter(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getType(),
                incident.getStatus(),
                incident.getAlerts().stream()
                        .map(AlertMapper::toDTO)
                        .toList()
        );
    }

    public static IncidentResponseDTO toResponseDTO(IncidentDTO dto) {
        return new IncidentResponseDTO(
                dto.id(),
                dto.title(),
                dto.description(),
                dto.type(),
                dto.status(),
                dto.alerts().stream()
                        .map(AlertMapper::toResponseDTO)
                        .toList()
        );
    }
}
