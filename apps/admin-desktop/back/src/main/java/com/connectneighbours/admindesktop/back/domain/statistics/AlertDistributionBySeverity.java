package com.connectneighbours.admindesktop.back.domain.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.Severity;

public record AlertDistributionBySeverity(
        Severity severity,
        Long count,
        Double rate
) {
}
