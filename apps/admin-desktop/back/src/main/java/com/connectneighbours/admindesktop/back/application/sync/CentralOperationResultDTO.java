package com.connectneighbours.admindesktop.back.application.sync;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CentralOperationResultDTO(
        String operationId,
        String entityType,
        String entityId,
        String operationType,
        String status,
        String error
) {}
