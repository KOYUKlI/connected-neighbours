package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class IncidentManagement {
    private final IncidentRepository incidentRepository;
    private final IncidentService incidentService;

    public IncidentManagement(IncidentRepository incidentRepository, IncidentService incidentService) {
        this.incidentRepository = incidentRepository;
        this.incidentService = incidentService;
    }

    public IncidentDTO createIncident(CreationIncidentDTO dto) {
        validateCreate(dto);
        Incident incident = new Incident(dto.reporter(), dto.title(), dto.description(), dto.type(),dto.severity());
        var savedIncident = incidentRepository.save(incident);

        return IncidentMapper.toDTO(savedIncident);
    }

    public IncidentDTO openIncident(UUID id) {
        var incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException("Incident not found with Id : "+id));

        incidentService.open(incident);

        var saved = incidentRepository.save(incident);
        return IncidentMapper.toDTO(saved);
    }



    public IncidentDTO startIncidentProgress(UUID incidentId) {
        Incident incident = loadIncident(incidentId);
        incidentService.startProgress(incident);
        var savedIncident = incidentRepository.save(incident);
        return IncidentMapper.toDTO(savedIncident);

    }

    public IncidentDTO closeIncident(UUID id) {
        var incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException("Incident not found with id : "+id));

        incidentService.close(incident);

        var saved = incidentRepository.save(incident);
        return IncidentMapper.toDTO(saved);
    }


    public IncidentDTO resolveIncident(UUID incidentId) {
        Incident incident = loadIncident(incidentId);
        incidentService.resolve(incident);
        var savedIncident = incidentRepository.save(incident);
        return IncidentMapper.toDTO(savedIncident);
    }

    public IncidentDTO updateIncident(UUID incidentId, UpdateIncidentDTO dto) {
        if(incidentId == null) throw new IllegalArgumentException("UUID cannot be null");

        validateUpdate(dto);
        Incident incident = loadIncident(incidentId);

        incident.setTitle(dto.title());
        incident.setDescription(dto.description());
        incident.setType(dto.type());
        incident.setSeverity(dto.severity());

        var saved = incidentRepository.save(incident);
        return IncidentMapper.toDTO(saved);
    }

    public IncidentDTO getIncident(UUID incidentId) {
        return IncidentMapper.toDTO(loadIncident(incidentId));
    }


    public List<IncidentDTO> listIncidents(int page, int size) {
        return incidentRepository.findAll(PageRequest.of(page, size))
                .stream()
                .map(IncidentMapper::toDTO)
                .toList();
    }

    public Page<IncidentDTO> listIncidents(Pageable pageable) {
        return incidentRepository.findAll(pageable).map(IncidentMapper::toDTO);
    }

    public List<IncidentDTO> listByStatus(IncidentStatus status) {
        return incidentRepository.findByStatus(status).stream()
                .map(IncidentMapper::toDTO)
                .toList();
    }


    public List<IncidentDTO> listByType(IncidentType type) {
        return incidentRepository.findByType(type).stream()
                .map(IncidentMapper::toDTO)
                .toList();
    }

    public List<IncidentDTO> listByDateRange(LocalDateTime start, LocalDateTime end) {
        return incidentRepository.findByCreatedAtBetween(start, end).stream()
                .map(IncidentMapper::toDTO)
                .toList();
    }

    private Incident loadIncident(UUID id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException("Incident not found: " + id));
    }

    public void deleteIncident(UUID id) {
        if (id == null) throw new IllegalArgumentException("UUID cannot be null");

        Incident incident = loadIncident(id);

        incidentService.ensureCanBeDeleted(incident);

        incidentRepository.delete(incident);
    }

    private void validateCreate(CreationIncidentDTO dto) {
        if (dto.reporter() == null) throw new IllegalArgumentException("Reporter cannot be null");
        if (dto.title() == null || dto.title().isBlank()) throw new IllegalArgumentException("Title cannot be null or empty");
        if (dto.description() == null || dto.description().isBlank()) throw new IllegalArgumentException("Description cannot be null or empty");
        if (dto.type() == null) throw new IllegalArgumentException("Type cannot be null");
    }

    private void validateUpdate(UpdateIncidentDTO dto) {
        if (dto.title() == null || dto.title().isBlank()) throw new IllegalArgumentException("Title cannot be null or empty");
        if (dto.description() == null || dto.description().isBlank()) throw new IllegalArgumentException("Description cannot be null or empty");
        if (dto.type() == null) throw new IllegalArgumentException("Type cannot be null");
        if (dto.severity() == null) throw new IllegalArgumentException("Severity cannot be null");
    }

}
