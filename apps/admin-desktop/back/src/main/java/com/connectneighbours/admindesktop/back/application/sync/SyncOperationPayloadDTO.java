package com.connectneighbours.admindesktop.back.application.sync;

import java.util.UUID;

public record SyncOperationPayloadDTO(
        UUID operationId,
        String entityType,
        String operationType,
        Object payload
) {}
