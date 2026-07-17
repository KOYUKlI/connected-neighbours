package com.connectneighbours.admindesktop.back.application.sync;

public record CentralSyncOperationDTO(
        String operationId,
        String entityType,
        String operationType,
        Object payload,
        String entityId
) {}
