package com.connectneighbours.admindesktop.back.infrastructure.incident;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
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
        return incidentDAO.findByCreatedAtBetween(start, end);
    }

    @Override
    public List<Incident> findByReporter(Reporter reporter) {
        return incidentDAO.findByReporter(reporter);
    }

    @Override
    public List<Incident> findByUpdatedAtAfter(Instant since) {
        return incidentDAO.findByUpdatedAtAfter(since);
    }

    @Override
    public List<Incident> findByExternalIdIsNull() {
        return incidentDAO.findByExternalIdIsNull();
    }

    @Override
    public Optional<Incident> findByExternalId(String externalId) {
        return incidentDAO.findByExternalId(externalId);
    }

    @Override
    public List<Incident> findByExternalIdIsNotNullAndUpdatedAtAfter(Instant since) {
        return incidentDAO.findByExternalIdIsNotNullAndUpdatedAtAfter(since);
    }

    @Override
    public Long countByTypeAndCreatedAtBetween(IncidentType type, LocalDateTime start, LocalDateTime end) {
        return incidentDAO.countByTypeAndCreatedAtBetween(type,start,end);
    }

    @Override
    public void delete(Incident incident) {
        incidentDAO.delete(incident);
    }

    @Override
    public Page<Incident> findAll(Pageable pageable) {
        return incidentDAO.findAll(pageable);
    }

    @Override
    public long count() {
        return incidentDAO.count();
    }

    @Override
    public void flush() {
        incidentDAO.flush();
    }
}
