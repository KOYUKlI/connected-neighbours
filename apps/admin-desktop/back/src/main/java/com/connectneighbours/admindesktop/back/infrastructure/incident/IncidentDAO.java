package com.connectneighbours.admindesktop.back.infrastructure.incident;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentDAO extends JpaRepository<Incident, UUID> {
    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByType(IncidentType type);

    List<Incident> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Incident> findByReporter(Reporter reporter);

    List<Incident> findByUpdatedAtAfter(Instant since);

    List<Incident> findByExternalIdIsNull();

    Optional<Incident> findByExternalId(String externalId);

    List<Incident> findByExternalIdIsNotNullAndUpdatedAtAfter(Instant since);

    Long countByTypeAndCreatedAtBetween(IncidentType type, LocalDateTime start, LocalDateTime end);
}
