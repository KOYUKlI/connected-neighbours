package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertResponseDTO;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record IncidentResponseDTO(
        @NotNull UUID id,
        @NotBlank String title,
        @NotBlank String description,
        @NotNull IncidentType type,
        @NotNull IncidentStatus status,
        List<AlertResponseDTO> alerts
) {}

