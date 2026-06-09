package com.connectneighbours.admindesktop.back.application.incident.service.alert;

import com.connectneighbours.admindesktop.back.application.incident.service.IncidentDTO;
import com.connectneighbours.admindesktop.back.domain.alert.*;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertNotFoundException;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.infrastructure.incident.IncidentRepositoryImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AlertManagement {
    private final AlertRepository alertRepository;
    private final AlertService alertService;
    private final IncidentRepository incidentRepository;

    public AlertManagement(AlertRepository alertRepository, AlertService alertService,IncidentRepository incidentRepository) {
        this.alertRepository = alertRepository;
        this.alertService = alertService;
        this.incidentRepository = incidentRepository;
    }

    public AlertDTO resolveAlert(UUID alertId) {
        Alert alert = loadAlert(alertId);
        alertService.resolve(alert);
        var savedAlert = alertRepository.save(alert);
        return AlertMapper.toDTO(savedAlert);
    }

    public AlertDTO updateAlert(UUID alertId, UpdateAlertDTO dto) {
        Alert alert = loadAlert(alertId);

        alert.setMessage(dto.message());
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

    public List<AlertDTO> listBySeverity(Severity severity) {
        var list = alertRepository.findBySeverity(severity);
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    public List<AlertDTO> listByStatus(AlertStatus status){
        var list = alertRepository.findByStatus(status);
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    public List<AlertDTO> listByIncident(IncidentDTO dto){
        var incident = loadIncident(dto.id());
        var list = alertRepository.findByIncident(incident);
        return list.stream()
                .map(AlertMapper::toDTO)
                .toList();
    }

    private Incident loadIncident(UUID id){
        return incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException("Incident not found with id : " + id));
    }

    private Alert loadAlert(UUID id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new AlertNotFoundException(id.toString()));
    }
}
