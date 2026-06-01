package com.connectneighbours.admindesktop.back.domain.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentRepository {
    Incident save(Incident incident);
    Optional<Incident> findById(UUID incidentId);
    List<Incident> findAll();
    List<Incident> findByStatus(IncidentStatus status);
    List<Incident> findByType(IncidentType type);
    List<Incident> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    void delete(Incident incident);
}
