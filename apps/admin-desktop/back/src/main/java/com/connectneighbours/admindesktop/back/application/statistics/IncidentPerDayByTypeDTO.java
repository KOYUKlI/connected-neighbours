package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

import java.time.LocalDateTime;

public record IncidentPerDayByTypeDTO(Long count, IncidentType type, LocalDateTime dateTime) {
}
