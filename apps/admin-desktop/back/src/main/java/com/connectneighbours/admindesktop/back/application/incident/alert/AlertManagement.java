package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.IncidentMapper;
import com.connectneighbours.admindesktop.back.domain.alert.*;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertNotFoundException;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.exception.reporter.ReporterNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentService;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AlertManagement {
    private final AlertRepository alertRepository;
    private final AlertService alertService;
    private final IncidentRepository incidentRepository;
    private final IncidentService incidentService;
    private final ReporterRepository reporterRepository;

    public AlertManagement(AlertRepository alertRepository, AlertService alertService, IncidentRepository incidentRepository, IncidentService incidentService, ReporterRepository reporterRepository) {
        this.alertRepository = alertRepository;
        this.alertService = alertService;
        this.incidentRepository = incidentRepository;
        this.incidentService = incidentService;
        this.reporterRepository = reporterRepository;
    }

    public AlertDTO addAlertToIncident(UUID incidentId, CreationAlertDTO dto) {
        if (incidentId == null) throw new IllegalArgumentException("Incident ID cannot be null");

        validateCreationAlert(dto);

        Incident incident = loadIncident(incidentId);
        Reporter reporter = loadReporter(dto.reporter().idReporter());

        Alert alert = new Alert(
                incident,
                reporter,
                dto.title(),
                dto.message(),
                dto.severity()
        );

        alertService.open(alert);
        incidentService.attachAlert(incident, alert);

        var savedAlert = alertRepository.save(alert);
        incidentRepository.save(incident);

        return AlertMapper.toDTO(savedAlert);
    }

    public IncidentDTO detachAlertFromIncident(UUID incidentId, UUID alertId) {
        if (incidentId == null) throw new IllegalArgumentException("Incident ID cannot be null");
        if (alertId == null) throw new IllegalArgumentException("Alert ID cannot be null");

        Incident incident = loadIncident(incidentId);
        Alert alert = loadAlert(alertId);

        incidentService.detachAlert(incident, alert);
        var savedIncident = incidentRepository.save(incident);

        return IncidentMapper.toDTO(savedIncident);
    }

    public AlertDTO resolveAlert(UUID alertId) {
        Alert alert = loadAlert(alertId);
        alertService.resolve(alert);
        var savedAlert = alertRepository.save(alert);
        return AlertMapper.toDTO(savedAlert);
    }

    public AlertDTO startAlertProgress(UUID alertId) {
        Alert alert = loadAlert(alertId);
        alertService.inProgress(alert);
        var savedAlert = alertRepository.save(alert);
        return AlertMapper.toDTO(savedAlert);
    }

    public AlertDTO openAlert(UUID alertId) {
        Alert alert = loadAlert(alertId);
        alertService.open(alert);
        var savedAlert = alertRepository.save(alert);
        return AlertMapper.toDTO(savedAlert);
    }

    public AlertDTO closeAlert(UUID alertId) {
        Alert alert = loadAlert(alertId);
        alertService.close(alert);
        var savedAlert = alertRepository.save(alert);
        return AlertMapper.toDTO(savedAlert);
    }

    public AlertDTO updateAlert(UUID alertId, UpdateAlertDTO dto) {
        Alert alert = loadAlert(alertId);

        alert.setTitle(dto.title());
        alert.setDetails(dto.message());
        alert.setSeverity(dto.severity());

        var saved = alertRepository.save(alert);
        return AlertMapper.toDTO(saved);
    }

    public List<AlertDTO> listAlerts() {
        var list = alertRepository.findAll();
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    public List<AlertDTO> listBySeverity(AlertSeverity severity) {
        var list = alertRepository.findBySeverity(severity);
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    public List<AlertDTO> listByStatus(AlertStatus status) {
        var list = alertRepository.findByStatus(status);
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    public List<AlertDTO> listByIncident(IncidentDTO dto) {
        var incident = loadIncident(dto.id());
        var list = alertRepository.findByIncident(incident);
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    public List<AlertDTO> listByIncidentAndSeverity(IncidentDTO dto, AlertSeverity severity) {
        var incident = loadIncident(dto.id());
        var list = alertRepository.findByIncidentAndSeverity(incident,severity);
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    private Incident loadIncident(UUID id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException("Incident not found with id : " + id));
    }

    private Alert loadAlert(UUID id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new AlertNotFoundException(id.toString()));
    }

    private Reporter loadReporter(UUID id) {
        return reporterRepository.findById(id)
                .orElseThrow(() -> new ReporterNotFoundException(id.toString()));
    }

    private void validateCreationAlert(CreationAlertDTO dto) {
        if (dto == null) throw new IllegalArgumentException("Alert DTO cannot be null");
        if (dto.reporter() == null) throw new IllegalArgumentException("Reporter cannot be null");
        if (dto.title() == null || dto.title().isBlank())
            throw new IllegalArgumentException("Alert title cannot be null or empty");
        if (dto.message() == null || dto.message().isBlank())
            throw new IllegalArgumentException("Alert message cannot be null or empty");
        if (dto.severity() == null)
            throw new IllegalArgumentException("Severity cannot be null");
    }
}
