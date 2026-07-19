package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record AlertDTO(
        @NotNull UUID id,
        @NotBlank String title,
        @NotNull ReporterDTO reporter,
        @NotNull AlertSeverity severity,
        @NotNull AlertStatus status,
        @NotNull LocalDateTime createdAt,
        @NotNull LocalDateTime resolvedAt,
        @NotBlank String details
) {
}

