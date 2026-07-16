package com.connectneighbours.admindesktop.back.application.sync;

public record CentralAlertPayload(
        String title,
        String details,
        String severity,
        String status,
        String incidentId,
        String externalId
) {}
