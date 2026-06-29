package com.connectneighbours.admindesktop.back.domain.statistics;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

public record IncidentDistributionByType(
        IncidentType type,
        Long count,
        Double rate
) {
}
