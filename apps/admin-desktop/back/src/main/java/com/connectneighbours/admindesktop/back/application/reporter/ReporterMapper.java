package com.connectneighbours.admindesktop.back.application.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;

public class ReporterMapper {
    public static ReporterDTO toDTO(Reporter reporter) {
        return new ReporterDTO(
                reporter.getIdReporter(),
                reporter.getFirstname(),
                reporter.getLastname()
        );
    }
}
