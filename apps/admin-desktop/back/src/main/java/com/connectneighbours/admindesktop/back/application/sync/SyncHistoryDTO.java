package com.connectneighbours.admindesktop.back.application.sync;

public record SyncHistoryDTO(
        String timestamp,
        String type,
        int count
) {}

