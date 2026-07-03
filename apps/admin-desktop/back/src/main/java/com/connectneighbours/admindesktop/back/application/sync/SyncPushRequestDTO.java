package com.connectneighbours.admindesktop.back.application.sync;

import java.util.List;

public record SyncPushRequestDTO(
        String clientId,
        List<SyncOperationPayloadDTO> operations
) {}