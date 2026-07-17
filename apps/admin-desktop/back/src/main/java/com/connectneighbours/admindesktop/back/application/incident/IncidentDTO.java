package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record IncidentDTO(
        @NotNull UUID id,
        @NotNull String displayId,
        @NotNull ReporterDTO reporter,
        @NotBlank String title,
        @NotBlank String description,
        @NotNull IncidentType type,
        @NotNull IncidentStatus status,
        @NotNull IncidentSeverity severity,
        List<AlertDTO> alerts,
        @NotNull LocalDateTime createdAt,
        LocalDateTime resolvedAt
        ) {
}

