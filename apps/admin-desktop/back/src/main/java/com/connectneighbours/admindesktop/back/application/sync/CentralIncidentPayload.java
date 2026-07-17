package com.connectneighbours.admindesktop.back.application.sync;

public record CentralIncidentPayload(
        String title,
        String description,
        String type,
        String severity,
        String status,
        String neighborhoodId,
        String externalId
) {}
