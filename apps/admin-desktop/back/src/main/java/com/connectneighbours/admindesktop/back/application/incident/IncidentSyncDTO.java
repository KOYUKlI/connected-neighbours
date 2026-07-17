package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertSyncDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record IncidentSyncDTO(
        UUID externalId,
        String title,
        String description,
        String status,
        String type,
        String severity,
        UUID neighborhoodId,
        String source,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt,
        List<AlertSyncDTO> alerts
) {}

