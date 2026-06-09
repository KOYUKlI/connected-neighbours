package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

public class IncidentRepositoryInMemory implements IncidentRepository {
    private final Map<UUID, Incident> data = new HashMap<>();

    @Override
    public Incident save(Incident incident) {
        data.put(incident.getIncidentId(), incident);
        return incident;
    }

    @Override
    public Optional<Incident> findById(UUID id) {
        return Optional.ofNullable(data.get(id));
    }

    @Override
    public List<Incident> findAll() {
        return new ArrayList<>(data.values());
    }

    @Override
    public Page<Incident> findAll(Pageable pageable) {
        List<Incident> content = findAll(
                pageable.getPageNumber(),
                pageable.getPageSize()
        );

        return new PageImpl<>(content, pageable, data.size());
    }


    public List<Incident> findAll(int page, int size) {
        return data.values().stream()
                .skip((long) page * size)
                .limit(size)
                .toList();
    }

    @Override
    public List<Incident> findByStatus(IncidentStatus status) {
        return data.values().stream()
                .filter(i -> i.getStatus() == status)
                .toList();
    }

    @Override
    public List<Incident> findByType(IncidentType type) {
        return data.values().stream()
                .filter(i -> i.getType() == type)
                .toList();
    }

    @Override
    public List<Incident> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end) {
        return data.values().stream()
                .filter(i -> i.getCreatedAt().isAfter(start) && i.getCreatedAt().isBefore(end))
                .toList();
    }

    @Override
    public List<Incident> findByReporter(Reporter reporter) {
        return data.values().stream()
                .filter(i -> i.getReporter().equals(reporter))
                .toList();
    }

    @Override
    public void delete(Incident incident) {
        data.remove(incident.getIncidentId());
    }
}
