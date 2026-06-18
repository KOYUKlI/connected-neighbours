package com.connectneighbours.admindesktop.back.domain.alert;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertRepository {
    Alert save(Alert alert);

    Optional<Alert> findById(UUID alertId);

    List<Alert> findAll();

    List<Alert> findByIncident(Incident incident);

    List<Alert> findBySeverity(Severity severity);

    List<Alert> findByStatus(AlertStatus status);

    List<Alert> findByReporter(Reporter reporter);

    void delete(Alert alert);
}
