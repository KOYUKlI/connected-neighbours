package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreationIncidentDTO(
        @NotNull Reporter reporter,
        @NotBlank String title,
        @NotBlank String description,
        @NotNull IncidentType type
) {
}

