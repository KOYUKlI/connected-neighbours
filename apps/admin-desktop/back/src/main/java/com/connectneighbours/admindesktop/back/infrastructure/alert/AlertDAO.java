package com.connectneighbours.admindesktop.back.infrastructure.alert;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertDAO extends JpaRepository<Alert, UUID> {
    List<Alert> findByIncident(Incident incident);

    List<Alert> findBySeverity(AlertSeverity severity);

    List<Alert> findByStatus(AlertStatus status);

    List<Alert> findByReporter(Reporter reporter);

    List<Alert> findByIncidentAndSeverity(Incident incident, AlertSeverity severity);

    List<Alert> findByUpdatedAtAfter(Instant since);

    List<Alert> findByExternalIdIsNull();

    Optional<Alert> findByExternalId(String externalId);

    List<Alert> findByExternalIdIsNotNullAndUpdatedAtAfter(Instant since);
}
