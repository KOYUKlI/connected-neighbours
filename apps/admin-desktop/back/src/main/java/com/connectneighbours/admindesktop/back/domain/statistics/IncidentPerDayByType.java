package com.connectneighbours.admindesktop.back.domain.statistics;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

import java.time.LocalDateTime;

public record IncidentPerDayByType(Long count, IncidentType type, LocalDateTime dateTime) {
}
