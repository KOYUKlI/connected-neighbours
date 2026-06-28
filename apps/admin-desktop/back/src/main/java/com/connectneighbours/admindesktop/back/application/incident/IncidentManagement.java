package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertMapper;
import com.connectneighbours.admindesktop.back.application.incident.alert.CreationAlertDTO;
import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertService;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertNotFoundException;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class IncidentManagement {
    @Autowired
    private DataSource dataSource;


    private final AlertRepository alertRepository;
    private final IncidentRepository incidentRepository;
    private final AlertService alertService;
    private final IncidentService incidentService;

    public IncidentManagement(AlertRepository alertRepository, IncidentRepository incidentRepository, AlertService alertService, IncidentService incidentService) {
        this.alertRepository = alertRepository;
        this.incidentRepository = incidentRepository;
        this.alertService = alertService;
        this.incidentService = incidentService;
    }

    public IncidentDTO createIncident(CreationIncidentDTO dto) {
        validateCreate(dto);
        Incident incident = new Incident(dto.reporter(), dto.title(), dto.description(), dto.type());
        incidentService.open(incident);
        var savedIncident = incidentRepository.save(incident);

        return IncidentMapper.toDTO(savedIncident);
    }


    public IncidentDTO startIncidentProgress(UUID incidentId) {
        Incident incident = loadIncident(incidentId);
        incidentService.startProgress(incident);
        var savedIncident = incidentRepository.save(incident);
        return IncidentMapper.toDTO(savedIncident);

    }

    public IncidentDTO resolveIncident(UUID incidentId) {
        Incident incident = loadIncident(incidentId);
        incidentService.resolve(incident);
        var savedIncident = incidentRepository.save(incident);
        return IncidentMapper.toDTO(savedIncident);
    }

    public AlertDTO addAlertToIncident(UUID incidentId, CreationAlertDTO dto) {
        if (incidentId == null) throw new IllegalArgumentException("Incident ID cannot be null");

        validateCreationAlert(dto);

        Incident incident = loadIncident(incidentId);

        Alert alert = new Alert(
                incident,
                dto.message(),
                dto.severity()
        );

        alertService.open(alert);
        incidentService.attachAlert(incident, alert);

        var savedAlert = alertRepository.save(alert);
        incidentRepository.save(incident);

        return AlertMapper.toDTO(savedAlert);
    }

    public IncidentDTO detachAlertFromIncident(UUID incidentId, UUID alertId) {
        if (incidentId == null) throw new IllegalArgumentException("Incident ID cannot be null");
        if (alertId == null) throw new IllegalArgumentException("Alert ID cannot be null");

        Incident incident = loadIncident(incidentId);
        Alert alert = loadAlert(alertId);

        incidentService.detachAlert(incident, alert);
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


    private Alert loadAlert(UUID id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new AlertNotFoundException(id.toString()));
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
    }


    private void validateCreationAlert(CreationAlertDTO dto) {
        if (dto == null) throw new IllegalArgumentException("Alert DTO cannot be null");
        if (dto.message() == null || dto.message().isBlank())
            throw new IllegalArgumentException("Alert message cannot be null or empty");
        if (dto.severity() == null)
            throw new IllegalArgumentException("Severity cannot be null");
    }

    @PostConstruct
    public void debug() {
        System.out.println(">>> IncidentManagement bean = " + this);
        System.out.println(">>> DataSource = " + dataSource);
    }

}
