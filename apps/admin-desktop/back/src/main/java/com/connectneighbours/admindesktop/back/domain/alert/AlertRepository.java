package com.connectneighbours.admindesktop.back.domain.alert;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertRepository {
    Alert save(Alert alert);

    Optional<Alert> findById(UUID alertId);

    List<Alert> findAll();

    List<Alert> findByIncident(Incident incident);

    List<Alert> findBySeverity(AlertSeverity severity);

    List<Alert> findByStatus(AlertStatus status);

    List<Alert> findByReporter(Reporter reporter);

    List<Alert> findByIncidentAndSeverity(Incident incident, AlertSeverity severity);

    List<Alert> findByUpdatedAtAfter(Instant since);

    void delete(Alert alert);

    long count();
}
