package com.connectneighbours.admindesktop.back.infrastructure.alert;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class AlertRepositoryImpl implements AlertRepository {
    private final AlertDAO alertDAO;

    public AlertRepositoryImpl(AlertDAO alertDAO) {
        this.alertDAO = alertDAO;
    }

    @Override
    public Alert save(Alert alert) {
        return alertDAO.save(alert);
    }

    @Override
    public Optional<Alert> findById(UUID alertId) {
        return alertDAO.findById(alertId);
    }

    @Override
    public List<Alert> findAll() {
        return alertDAO.findAll();
    }

    @Override
    public List<Alert> findByIncident(Incident incident) {
        return alertDAO.findByIncident(incident);
    }

    @Override
    public List<Alert> findBySeverity(AlertSeverity severity) {
        return alertDAO.findBySeverity(severity);
    }

    @Override
    public List<Alert> findByStatus(AlertStatus status) {
        return alertDAO.findByStatus(status);
    }

    @Override
    public List<Alert> findByReporter(Reporter reporter) {
        return alertDAO.findByReporter(reporter);
    }

    @Override
    public List<Alert> findByIncidentAndSeverity(Incident incident, AlertSeverity severity) {
        return alertDAO.findByIncidentAndSeverity(incident,severity);
    }

    @Override
    public List<Alert> findByUpdatedAtAfter(Instant since) {
        return alertDAO.findByUpdatedAtAfter(since);
    }

    @Override
    public void delete(Alert alert) {
        alertDAO.delete(alert);
    }

    @Override
    public long count() {
        return alertDAO.count();
    }
}
