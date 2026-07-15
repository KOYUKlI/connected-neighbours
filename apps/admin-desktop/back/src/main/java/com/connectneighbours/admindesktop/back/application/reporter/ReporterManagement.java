package com.connectneighbours.admindesktop.back.application.reporter;

import com.connectneighbours.admindesktop.back.domain.exception.reporter.ReporterNotFoundException;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ReporterManagement {
    private final ReporterRepository reporterRepository;

    public ReporterManagement(ReporterRepository reporterRepository) {
        this.reporterRepository = reporterRepository;
    }

    public List<ReporterDTO> listReporters() {
        var list = reporterRepository.findAll();
        return list.stream()
                .map(ReporterMapper::toDTO)
                .toList();
    }

    public Page<ReporterDTO> listReporter(Pageable pageable) {
        return reporterRepository.findAll(pageable).map(ReporterMapper::toDTO);
    }

    public List<ReporterDTO> listByFirstname(String firstname) {
        var list = reporterRepository.findByFirstname(firstname);
        return list.stream()
                .map(ReporterMapper::toDTO)
                .toList();
    }

    public List<ReporterDTO> listByLastname(String lastname) {
        var list = reporterRepository.findByLastname(lastname);
        return list.stream()
                .map(ReporterMapper::toDTO)
                .toList();
    }

    public void deleteReporter(UUID id) {
        var reporter = loadReporter(id);
        reporterRepository.delete(reporter);
    }

    // Pas encore de notion d'utilisateur connecté : on retombe sur le premier
    // reporter trouvé en base pour les créations qui en ont besoin.
    public Reporter getDefaultReporter() {
        return reporterRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ReporterNotFoundException("No reporter available"));
    }

    private Reporter loadReporter(UUID uuid) {
        return reporterRepository.findById(uuid).orElseThrow(() -> new ReporterNotFoundException("reporter not found with id : " + uuid));
    }
}
