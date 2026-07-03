package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterMapper;
import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;

public class AlertMapper {
    public static AlertDTO toDTO(Alert alert) {
        return new AlertDTO(
                alert.getAlertId(),
                alert.getTitle(),
                ReporterMapper.toDTO(alert.getReporter()),
                alert.getSeverity(),
                alert.getStatus(),
                alert.getCreatedAt(),
                alert.getResolvedAt(),
                alert.getDetails()
        );
    }

    public static AlertResponseDTO toResponseDTO(AlertDTO dto) {
        return new AlertResponseDTO(
                dto.id(),
                dto.details(),
                dto.severity(),
                dto.status()
        );
    }

    public static AlertSyncDTO toAlertSyncDTO(Alert a) {
        return new AlertSyncDTO(
                a.getAlertId(),
                a.getIncident().getIncidentId(),
                a.getTitle(),
                a.getDetails(),
                a.getSeverity().name().toLowerCase(),
                a.getStatus().name().toLowerCase(),
                "desktop",
                ReporterMapper.toDTO(a.getReporter()),
                a.getCreatedAt(),
                a.getResolvedAt()

        );
    }

    public static AlertDTO fromSyncDTO(AlertSyncDTO dto) {
        return new AlertDTO(
                dto.externalId(),
                dto.title(),
                dto.reporter(),
                AlertSeverity.valueOf(dto.severity().toUpperCase()),
                AlertStatus.valueOf(dto.status().toUpperCase()),
                dto.createdAt(),
                dto.resolvedAt(),
                dto.details()
        );
    }


}
