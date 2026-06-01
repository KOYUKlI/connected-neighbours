package com.connectneighbours.admindesktop.back.infrastructure.incident;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class IncidentRepositoryImpl implements IncidentRepository {
    private final IncidentDAO incidentDAO;

    public IncidentRepositoryImpl(IncidentDAO incidentDAO) {
        this.incidentDAO = incidentDAO;
    }

    @Override
    public Incident save(Incident incident) {
        return incidentDAO.save(incident);
    }

    @Override
    public Optional<Incident> findById(UUID incidentId) {
        return incidentDAO.findById(incidentId);
    }

    @Override
    public List<Incident> findAll() {
        return incidentDAO.findAll();
    }

    @Override
    public List<Incident> findByStatus(IncidentStatus status) {
        return incidentDAO.findByStatus(status);
    }

    @Override
    public List<Incident> findByType(IncidentType type) {
        return incidentDAO.findByType(type);
    }

    @Override
    public List<Incident> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end) {
        return incidentDAO.findByCreatedAtBetween(start,end);
    }

    @Override
    public void delete(Incident incident) {
        incidentDAO.delete(incident);
    }
}
