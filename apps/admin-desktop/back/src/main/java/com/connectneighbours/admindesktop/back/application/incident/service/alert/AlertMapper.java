package com.connectneighbours.admindesktop.back.application.incident.service.alert;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;

public class AlertMapper {
    public static AlertDTO toDTO(Alert alert) {
        return new AlertDTO(
                alert.getAlertId(),
                alert.getMessage(),
                alert.getSeverity(),
                alert.getStatus()
        );
    }

    public static AlertResponseDTO toResponseDTO(AlertDTO dto) {
        return new AlertResponseDTO(
                dto.id(),
                dto.message(),
                dto.severity(),
                dto.status()
        );
    }
}
