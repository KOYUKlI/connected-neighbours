package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateAlertDTO(
        @NotBlank String title,
        @NotNull String message,
        @NotNull AlertSeverity severity
) {
}

