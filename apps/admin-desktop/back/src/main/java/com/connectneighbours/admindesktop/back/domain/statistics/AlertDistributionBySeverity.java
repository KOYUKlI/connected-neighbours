package com.connectneighbours.admindesktop.back.domain.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;

public record AlertDistributionBySeverity(
        AlertSeverity severity,
        Long count,
        Double rate
) {
}
