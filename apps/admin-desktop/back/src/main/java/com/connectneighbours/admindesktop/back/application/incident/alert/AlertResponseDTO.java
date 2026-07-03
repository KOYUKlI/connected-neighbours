package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AlertResponseDTO(
        @NotNull UUID id,
        @NotBlank String message,
        @NotNull AlertSeverity severity,
        @NotNull AlertStatus status
) {
}
