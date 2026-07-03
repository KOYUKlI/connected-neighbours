package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertMapper;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterMapper;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;

import java.util.UUID;

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
                incident.getSeverity(),
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

    public static IncidentSyncDTO toIncidentSyncDTO(Incident incident) {
        return new IncidentSyncDTO(
                incident.getIncidentId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getType().name().toLowerCase(),
                incident.getStatus().name().toLowerCase(),
                incident.getSeverity().name().toLowerCase(),
                UUID.randomUUID(),
                "desktop",
                incident.getCreatedAt(),
                incident.getResolvedAt(),
                incident.getAlerts().stream().map(AlertMapper::toAlertSyncDTO).toList()
        );
    }

//    public static IncidentDTO fromSyncDTO(IncidentSyncDTO dto) {
//        return new IncidentDTO(
//                dto.externalId(),
//                dto.title(),
//                dto.description(),
//                dto.type(),
//                dto.status(),
//                dto.severity(),
//                dto.alerts().stream().map(AlertMapper::fromSyncDTO).toList(),
//                dto.createdAt(),
//                dto.resolvedAt(),
//                dto.resolvedAt()
//        );
//    }
}
