package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;

import java.time.LocalDateTime;
import java.util.UUID;

public record AlertSyncDTO(
        UUID externalId,
        UUID incidentId,
        String title,
        String details,
        String severity,
        String status,
        String source,
        ReporterDTO reporter,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {}

