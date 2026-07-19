package com.connectneighbours.admindesktop.back.application.sync;

import com.connectneighbours.admindesktop.back.application.incident.IncidentSyncDTO;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertSyncDTO;

import java.util.List;

public record SyncPullResponseDTO(
        List<IncidentSyncDTO> incidents,
        List<AlertSyncDTO> alerts
) {}


