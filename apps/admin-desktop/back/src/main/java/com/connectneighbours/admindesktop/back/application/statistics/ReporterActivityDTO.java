package com.connectneighbours.admindesktop.back.application.statistics;

import java.util.UUID;

public record ReporterActivityDTO(
        UUID idReporter,
        String firstname,
        String lastname,
        Long incidentCount,
        Long alertCount
) {
}
