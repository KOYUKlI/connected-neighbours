package com.connectneighbours.admindesktop.back.domain.statistics;

import java.util.UUID;

public record ReporterActivity(
        UUID idReporter,
        String firstname,
        String lastname,
        Long incidentCount,
        Long alertCount
) {
}
