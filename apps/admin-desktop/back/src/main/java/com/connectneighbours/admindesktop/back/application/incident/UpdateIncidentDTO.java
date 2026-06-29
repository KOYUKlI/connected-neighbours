package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateIncidentDTO(
        @NotBlank String title,
        @NotBlank String description,
        @NotNull IncidentType type
) {
}

