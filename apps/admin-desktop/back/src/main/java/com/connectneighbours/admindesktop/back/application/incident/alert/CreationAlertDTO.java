package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreationAlertDTO(
        @NotNull ReporterDTO reporter,
        @NotBlank String title,
        @NotBlank String message,
        @NotNull AlertSeverity severity
) {
}
