package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;

public record AlertDistributionBySeverityDTO(
        AlertSeverity severity,
        Long count,
        Double rate,
        String percentage
) {
}
