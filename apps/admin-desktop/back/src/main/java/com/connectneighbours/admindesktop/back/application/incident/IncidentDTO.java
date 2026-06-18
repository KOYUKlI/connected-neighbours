package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record IncidentDTO(
        @NotNull UUID id,
        @NotNull Reporter reporter,
        @NotBlank String title,
        @NotBlank String description,
        @NotNull IncidentType type,
        @NotNull IncidentStatus status,
        List<AlertDTO> alerts
) {
}

