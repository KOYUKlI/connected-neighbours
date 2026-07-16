package com.connectneighbours.admindesktop.back.application.sync;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CentralAlertDTO(
        @JsonProperty("_id") String id,
        String incidentId,
        String title,
        String details,
        String severity,
        String status,
        String source,
        String externalId
) {}
