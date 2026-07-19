package com.connectneighbours.admindesktop.back.application.sync;

import java.util.List;

public record CentralPushRequest(
        String clientId,
        List<CentralSyncOperationDTO> operations
) {}
