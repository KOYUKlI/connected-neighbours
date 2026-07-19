package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRole;

import java.util.UUID;

public record ReporterActivityDTO(
        UUID idReporter,
        String firstname,
        String lastname,
        ReporterRole role,
        Long incidentCount,
        Long alertCount
) {
}
