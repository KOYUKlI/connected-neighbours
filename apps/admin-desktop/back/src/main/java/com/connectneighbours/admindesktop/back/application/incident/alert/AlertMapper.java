package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterMapper;
import com.connectneighbours.admindesktop.back.domain.alert.Alert;

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
}
