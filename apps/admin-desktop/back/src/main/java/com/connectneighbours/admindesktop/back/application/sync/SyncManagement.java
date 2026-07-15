package com.connectneighbours.admindesktop.back.application.sync;

import com.connectneighbours.admindesktop.back.application.incident.IncidentMapper;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertMapper;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.sync.SyncRepository;
import com.connectneighbours.admindesktop.back.infrastructure.sync.SyncHttpClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class SyncManagement {

    private final SyncRepository syncRepository;
    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final SyncHttpClient syncHttpClient;

    private final String clientId = "desktop-1";

    public SyncManagement(SyncRepository syncRepository,
                          IncidentRepository incidentRepository,
                          AlertRepository alertRepository, SyncHttpClient syncHttpClient) {
        this.syncRepository = syncRepository;
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
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
}

