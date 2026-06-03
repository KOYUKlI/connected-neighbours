package com.connectneighbours.admindesktop.back.application.incident.service.alert;

import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;

import java.util.UUID;

public record AlertDTO(
        UUID id,
        String message,
        Severity severity,
        AlertStatus status
) {}

