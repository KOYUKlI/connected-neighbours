package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

public record IncidentDistributionByTypeDTO(
        IncidentType type,
        Long count,
        Double rate,
        String percentage
) {
}
