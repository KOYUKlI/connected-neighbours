package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertMapper;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterMapper;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;

public class IncidentMapper {
    public static IncidentDTO toDTO(Incident incident) {
        return new IncidentDTO(
                incident.getIncidentId(),
                incident.getDisplayId(),
                ReporterMapper.toDTO(incident.getReporter()),
                incident.getTitle(),
                incident.getDescription(),
                incident.getType(),
                incident.getStatus(),
                incident.getAlerts().stream()
                        .map(AlertMapper::toDTO)
                        .toList(),
                incident.getCreatedAt(),
                incident.getResolvedAt()
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
