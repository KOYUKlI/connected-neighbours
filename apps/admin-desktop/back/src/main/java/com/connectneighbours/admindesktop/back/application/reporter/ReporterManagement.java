package com.connectneighbours.admindesktop.back.application.reporter;

import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.reporter.ReporterNotFoundException;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRole;
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

    public List<ReporterDTO> listByRole(ReporterRole role) {
        var list = reporterRepository.findByRole(role);
        return list.stream()
                .map(ReporterMapper::toDTO)
                .toList();
    }

    public void deleteReporter(UUID id) {
        var reporter = loadReporter(id);
        reporterRepository.delete(reporter);
    }

    public Reporter getOrCreateReporterFor(AuthenticatedSession session) {
        return reporterRepository.findByEmail(session.email())
                .orElseGet(() -> reporterRepository.save(new Reporter(
                        firstNameOf(session.displayName()),
                        lastNameOf(session.displayName()),
                        session.email(),
                        roleOf(session)
                )));
    }

    private ReporterRole roleOf(AuthenticatedSession session) {
        try {
            return ReporterRole.valueOf(session.role().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            return ReporterRole.RESIDENT;
        }
    }

    private String firstNameOf(String displayName) {
        String trimmed = displayName == null ? "" : displayName.trim();
        int spaceIndex = trimmed.indexOf(' ');
        return spaceIndex > 0 ? trimmed.substring(0, spaceIndex) : trimmed;
    }

    private String lastNameOf(String displayName) {
        String trimmed = displayName == null ? "" : displayName.trim();
        int spaceIndex = trimmed.indexOf(' ');
        return spaceIndex > 0 ? trimmed.substring(spaceIndex + 1) : "";
    }

    private Reporter loadReporter(UUID uuid) {
        return reporterRepository.findById(uuid).orElseThrow(() -> new ReporterNotFoundException("reporter not found with id : " + uuid));
    }
}
