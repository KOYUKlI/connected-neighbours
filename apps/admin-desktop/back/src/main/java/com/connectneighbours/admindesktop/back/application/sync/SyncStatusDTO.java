package com.connectneighbours.admindesktop.back.application.sync;

public record SyncStatusDTO(
        String clientId,
        String lastPush,
        String lastPull,
        int pendingOperations,
        String status
) {}

