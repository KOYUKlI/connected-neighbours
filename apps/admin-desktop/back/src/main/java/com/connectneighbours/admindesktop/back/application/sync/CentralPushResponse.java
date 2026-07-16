package com.connectneighbours.admindesktop.back.application.sync;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CentralPushResponse(
        List<CentralOperationResultDTO> acceptedOperations,
        List<CentralOperationResultDTO> rejectedOperations
) {}
