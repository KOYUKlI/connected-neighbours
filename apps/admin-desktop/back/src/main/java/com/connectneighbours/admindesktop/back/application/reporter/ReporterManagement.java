package com.connectneighbours.admindesktop.back.application.reporter;

import com.connectneighbours.admindesktop.back.domain.exception.reporter.ReporterNotFoundException;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;

import java.util.UUID;

public class ReporterManagement {
    private final ReporterRepository reporterRepository;

    public ReporterManagement(ReporterRepository reporterRepository) {
        this.reporterRepository = reporterRepository;
    }

    private Reporter loadReporter(UUID uuid){
        return reporterRepository.findById(uuid).orElseThrow(() -> new ReporterNotFoundException("reporter not found with id : " + uuid));
    }
}
