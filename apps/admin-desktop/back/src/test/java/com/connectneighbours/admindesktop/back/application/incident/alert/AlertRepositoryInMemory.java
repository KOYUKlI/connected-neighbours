package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;

import java.time.Instant;
import java.util.*;

public class AlertRepositoryInMemory implements AlertRepository {
    private final Map<UUID, Alert> data = new LinkedHashMap<>();

    @Override
    public Alert save(Alert alert) {
        data.put(alert.getAlertId(), alert);
        return alert;
    }

    @Override
    public Optional<Alert> findById(UUID id) {
        return Optional.ofNullable(data.get(id));
    }

    @Override
    public List<Alert> findAll() {
        return new ArrayList<>(data.values());
    }

    @Override
    public List<Alert> findByIncident(Incident incident) {
        return data.values().stream()
                .filter(a -> a.getIncident().equals(incident))
                .toList();
    }

    @Override
    public List<Alert> findBySeverity(AlertSeverity severity) {
        return data.values().stream()
                .filter(a -> a.getSeverity() == severity)
                .toList();
    }

    @Override
    public List<Alert> findByStatus(AlertStatus status) {
        return data.values().stream()
                .filter(a -> a.getStatus() == status)
                .toList();
    }

    @Override
    public List<Alert> findByReporter(Reporter reporter) {
        return data.values().stream()
                .filter(a -> a.getReporter().equals(reporter))
                .toList();
    }

    @Override
    public List<Alert> findByIncidentAndSeverity(Incident incident, AlertSeverity severity) {
        return List.of();
    }

    @Override
    public void delete(Alert alert) {
        data.remove(alert.getAlertId());
    }

    @Override
    public long count() {
        return 0;
    }

    @Override
    public List<Alert> findByUpdatedAtAfter(Instant since) {
        return List.of();
    }

    @Override
    public List<Alert> findByExternalIdIsNull() {
        return data.values().stream()
                .filter(a -> a.getExternalId() == null)
                .toList();
    }

    @Override
    public List<Alert> findByExternalIdIsNotNullAndUpdatedAtAfter(Instant since) {
        return data.values().stream()
                .filter(a -> a.getExternalId() != null
                        && a.getUpdatedAt() != null
                        && a.getUpdatedAt().isAfter(since))
                .toList();
    }

    @Override
    public Optional<Alert> findByExternalId(String externalId) {
        return data.values().stream()
                .filter(a -> externalId.equals(a.getExternalId()))
                .findFirst();
    }
}
