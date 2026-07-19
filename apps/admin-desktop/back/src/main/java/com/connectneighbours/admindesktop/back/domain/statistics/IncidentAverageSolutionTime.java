package com.connectneighbours.admindesktop.back.domain.statistics;

import java.time.LocalDateTime;

public record IncidentAverageSolutionTime(Long count, LocalDateTime dateTime, Long duration) {
}
