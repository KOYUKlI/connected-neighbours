package com.connectneighbours.admindesktop.back.infrastructure.alert;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertDAO extends JpaRepository<Alert, UUID> {
    List<Alert> findByIncident(Incident incident);

    List<Alert> findBySeverity(Severity severity);

    List<Alert> findByStatus(AlertStatus status);

    List<Alert> findByReporter(Reporter reporter);
}
