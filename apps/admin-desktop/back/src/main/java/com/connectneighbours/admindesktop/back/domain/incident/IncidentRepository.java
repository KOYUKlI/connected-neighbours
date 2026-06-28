package com.connectneighbours.admindesktop.back.domain.incident;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentRepository {
    Incident save(Incident incident);

    Optional<Incident> findById(UUID incidentId);

    List<Incident> findAll();

    Page<Incident> findAll(Pageable pageable);

    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByType(IncidentType type);

    List<Incident> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Incident> findByReporter(Reporter reporter);

    void delete(Incident incident);

    long count();
}
