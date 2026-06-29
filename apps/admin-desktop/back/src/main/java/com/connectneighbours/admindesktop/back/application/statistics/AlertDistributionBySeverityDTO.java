package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.Severity;

public record AlertDistributionBySeverityDTO(
        Severity severity,
        Long count,
        String percentage
) {
}
