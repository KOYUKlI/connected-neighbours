package com.connectneighbours.admindesktop.back.application.sync;

import com.connectneighbours.admindesktop.back.application.incident.IncidentMapper;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertMapper;
import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import com.connectneighbours.admindesktop.back.domain.sync.SyncRepository;
import com.connectneighbours.admindesktop.back.infrastructure.sync.SyncHttpClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
public class SyncManagement {

    private static final String NEIGHBORHOOD_ID = "quartier-centre";
    private static final String JAVAFX_SOURCE = "javafx";
    private static final String PLACEHOLDER_REPORTER_FIRSTNAME = "Resident";
    private static final String PLACEHOLDER_REPORTER_LASTNAME = "Web";

    private final SyncRepository syncRepository;
    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final ReporterRepository reporterRepository;
    private final SyncHttpClient syncHttpClient;

    private final String clientId = "desktop-1";

    public SyncManagement(SyncRepository syncRepository,
                          IncidentRepository incidentRepository,
                          AlertRepository alertRepository,
                          ReporterRepository reporterRepository,
                          SyncHttpClient syncHttpClient) {
        this.syncRepository = syncRepository;
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
        this.reporterRepository = reporterRepository;
        this.syncHttpClient = syncHttpClient;
    }

    public void push(SyncPushRequestDTO request) {
        syncRepository.applyOperations(request);
        syncRepository.recordPush(request.clientId(), request.operations().size());
    }

    public SyncPullResponseDTO pull(String clientId, String since) {
        var sinceDate = since != null ? Instant.parse(since) : Instant.EPOCH;

        var incidents = incidentRepository.findByUpdatedAtAfter(sinceDate).stream()
                .map(IncidentMapper::toIncidentSyncDTO)
                .toList();

        var alerts = alertRepository.findByUpdatedAtAfter(sinceDate).stream()
                .map(AlertMapper::toAlertSyncDTO)
                .toList();

        syncRepository.recordPull(clientId, incidents.size() + alerts.size());

        return new SyncPullResponseDTO(incidents, alerts);
    }

    public SyncStatusDTO status(String clientId) {
        var lastPush = syncRepository.findLastPush(clientId);
        var lastPull = syncRepository.findLastPull(clientId);
        var pending = syncRepository.countPendingOperations(clientId);

        return new SyncStatusDTO(
                clientId,
                lastPush,
                lastPull,
                pending,
                pending == 0 ? "OK" : "PENDING"
        );
    }

    public List<SyncHistoryDTO> history(String clientId) {
        return syncRepository.findHistory(clientId);
    }

    public List<SyncHistoryDTO> history() {
        return history(clientId);
    }

    public SyncStatusDTO status() {
        return status(clientId);
    }

    public SyncResultDTO synchronize() {
        var lastPushInstant = parseInstant(syncRepository.findLastPush(clientId));
        var pushedCount = pushIncidents(lastPushInstant) + pushAlerts(lastPushInstant);
        syncRepository.recordPush(clientId, pushedCount);

        var lastPull = syncRepository.findLastPull(clientId);
        var pulledCount = pullFromCentral(lastPull);
        syncRepository.recordPull(clientId, pulledCount);

        return new SyncResultDTO(pushedCount, pulledCount);
    }

    private int pushIncidents(Instant lastPushInstant) {
        var toCreate = incidentRepository.findByExternalIdIsNull();
        var toUpdate = lastPushInstant != null
                ? incidentRepository.findByExternalIdIsNotNullAndUpdatedAtAfter(lastPushInstant)
                : List.<Incident>of();

        var operations = new ArrayList<CentralSyncOperationDTO>();
        var incidentByOperationId = new HashMap<String, Incident>();

        for (var incident : toCreate) {
            var operationId = UUID.randomUUID().toString();
            incidentByOperationId.put(operationId, incident);
            operations.add(new CentralSyncOperationDTO(
                    operationId, "incident", "create", toIncidentPayload(incident), null));
        }

        for (var incident : toUpdate) {
            var operationId = UUID.randomUUID().toString();
            incidentByOperationId.put(operationId, incident);
            operations.add(new CentralSyncOperationDTO(
                    operationId, "incident", "update", toIncidentPayload(incident), incident.getExternalId()));
        }

        if (operations.isEmpty()) {
            return 0;
        }

        var response = syncHttpClient.push(new CentralPushRequest(clientId, operations));

        for (var accepted : response.acceptedOperations()) {
            var incident = incidentByOperationId.get(accepted.operationId());
            if (incident != null && incident.getExternalId() == null && accepted.entityId() != null) {
                incident.setExternalId(accepted.entityId());
                incidentRepository.save(incident);
            }
        }

        return response.acceptedOperations().size();
    }

    private int pushAlerts(Instant lastPushInstant) {
        var toCreate = alertRepository.findByExternalIdIsNull().stream()
                .filter(alert -> alert.getIncident().getExternalId() != null)
                .toList();
        var toUpdate = lastPushInstant != null
                ? alertRepository.findByExternalIdIsNotNullAndUpdatedAtAfter(lastPushInstant)
                : List.<Alert>of();

        var operations = new ArrayList<CentralSyncOperationDTO>();
        var alertByOperationId = new HashMap<String, Alert>();

        for (var alert : toCreate) {
            var operationId = UUID.randomUUID().toString();
            alertByOperationId.put(operationId, alert);
            operations.add(new CentralSyncOperationDTO(
                    operationId, "alert", "create", toAlertPayload(alert), null));
        }

        for (var alert : toUpdate) {
            var operationId = UUID.randomUUID().toString();
            alertByOperationId.put(operationId, alert);
            operations.add(new CentralSyncOperationDTO(
                    operationId, "alert", "update", toAlertPayload(alert), alert.getExternalId()));
        }

        if (operations.isEmpty()) {
            return 0;
        }

        var response = syncHttpClient.push(new CentralPushRequest(clientId, operations));

        for (var accepted : response.acceptedOperations()) {
            var alert = alertByOperationId.get(accepted.operationId());
            if (alert != null && alert.getExternalId() == null && accepted.entityId() != null) {
                alert.setExternalId(accepted.entityId());
                alertRepository.save(alert);
            }
        }

        return response.acceptedOperations().size();
    }

    private int pullFromCentral(String since) {
        var response = syncHttpClient.pull(clientId, since);
        var pulledCount = 0;

        for (var centralIncident : response.incidents()) {
            if (JAVAFX_SOURCE.equals(centralIncident.source())) {
                continue;
            }
            upsertIncident(centralIncident);
            pulledCount++;
        }

        for (var centralAlert : response.alerts()) {
            if (JAVAFX_SOURCE.equals(centralAlert.source())) {
                continue;
            }
            if (upsertAlert(centralAlert)) {
                pulledCount++;
            }
        }

        return pulledCount;
    }

    private void upsertIncident(CentralIncidentDTO dto) {
        var existing = incidentRepository.findByExternalId(dto.id());

        if (existing.isPresent()) {
            var incident = existing.get();
            incident.setTitle(dto.title());
            incident.setDescription(dto.description());
            incident.setType(IncidentType.valueOf(dto.type().toUpperCase()));
            incident.setSeverity(IncidentSeverity.valueOf(dto.severity().toUpperCase()));
            applyIncidentStatus(incident, dto.status());
            incidentRepository.save(incident);
            return;
        }

        var incident = new Incident(
                resolvePlaceholderReporter(),
                dto.title(),
                dto.description(),
                IncidentType.valueOf(dto.type().toUpperCase()),
                IncidentSeverity.valueOf(dto.severity().toUpperCase())
        );
        incident.setExternalId(dto.id());
        applyIncidentStatus(incident, dto.status());
        incidentRepository.save(incident);
    }

    private boolean upsertAlert(CentralAlertDTO dto) {
        var parentIncident = incidentRepository.findByExternalId(dto.incidentId());

        if (parentIncident.isEmpty()) {
            return false;
        }

        var existing = alertRepository.findByExternalId(dto.id());

        if (existing.isPresent()) {
            var alert = existing.get();
            alert.setDetails(dto.details());
            alert.setSeverity(AlertSeverity.valueOf(dto.severity().toUpperCase()));
            applyAlertStatus(alert, dto.status());
            alertRepository.save(alert);
            return true;
        }

        var alert = new Alert(
                parentIncident.get(),
                resolvePlaceholderReporter(),
                dto.title(),
                dto.details(),
                AlertSeverity.valueOf(dto.severity().toUpperCase())
        );
        alert.setExternalId(dto.id());
        applyAlertStatus(alert, dto.status());
        alertRepository.save(alert);
        return true;
    }

    private void applyIncidentStatus(Incident incident, String centralStatus) {
        switch (centralStatus) {
            case "open" -> incident.open();
            case "in_progress" -> incident.inProgress();
            case "resolved" -> incident.resolve();
            case "closed", "rejected" -> incident.close();
            default -> {
            }
        }
    }

    private void applyAlertStatus(Alert alert, String centralStatus) {
        switch (centralStatus) {
            case "open" -> alert.open();
            case "in_progress" -> alert.inProgress();
            case "resolved" -> alert.resolve();
            default -> {
            }
        }
    }

    private Reporter resolvePlaceholderReporter() {
        return reporterRepository.findByFirstname(PLACEHOLDER_REPORTER_FIRSTNAME).stream()
                .filter(reporter -> PLACEHOLDER_REPORTER_LASTNAME.equals(reporter.getLastname()))
                .findFirst()
                .orElseGet(() -> reporterRepository.save(
                        new Reporter(PLACEHOLDER_REPORTER_FIRSTNAME, PLACEHOLDER_REPORTER_LASTNAME)));
    }

    private CentralIncidentPayload toIncidentPayload(Incident incident) {
        return new CentralIncidentPayload(
                incident.getTitle(),
                incident.getDescription(),
                incident.getType().name().toLowerCase(),
                incident.getSeverity().name().toLowerCase(),
                mapIncidentStatus(incident.getStatus()),
                NEIGHBORHOOD_ID,
                incident.getIncidentId().toString()
        );
    }

    private CentralAlertPayload toAlertPayload(Alert alert) {
        return new CentralAlertPayload(
                alert.getTitle(),
                alert.getDetails(),
                alert.getSeverity().name().toLowerCase(),
                alert.getStatus().name().toLowerCase(),
                alert.getIncident().getExternalId(),
                alert.getAlertId().toString()
        );
    }

    private String mapIncidentStatus(IncidentStatus status) {
        return status == IncidentStatus.CREATED ? "reported" : status.name().toLowerCase();
    }

    private Instant parseInstant(String value) {
        return value != null ? Instant.parse(value) : null;
    }
}
