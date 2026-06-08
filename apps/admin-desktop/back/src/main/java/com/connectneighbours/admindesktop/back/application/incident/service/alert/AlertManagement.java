package com.connectneighbours.admindesktop.back.application.incident.service.alert;

import com.connectneighbours.admindesktop.back.domain.alert.*;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertNotFoundException;

import java.util.List;
import java.util.UUID;

public class AlertManagement {
    private final AlertRepository alertRepository;
    private final AlertService alertService;

    public AlertManagement(AlertRepository alertRepository, AlertService alertService) {
        this.alertRepository = alertRepository;
        this.alertService = alertService;
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

    private Alert loadAlert(UUID id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new AlertNotFoundException(id.toString()));
    }
}
