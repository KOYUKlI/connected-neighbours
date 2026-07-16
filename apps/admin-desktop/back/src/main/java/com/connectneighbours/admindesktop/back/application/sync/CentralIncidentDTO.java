package com.connectneighbours.admindesktop.back.application.sync;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CentralIncidentDTO(
        @JsonProperty("_id") String id,
        String title,
        String description,
        String type,
        String status,
        String severity,
        String neighborhoodId,
        String source,
        String externalId
) {}
