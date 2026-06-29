package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AlertResponseDTO(
        @NotNull UUID id,
        @NotBlank String message,
        @NotNull Severity severity,
        @NotNull AlertStatus status
) {
}
