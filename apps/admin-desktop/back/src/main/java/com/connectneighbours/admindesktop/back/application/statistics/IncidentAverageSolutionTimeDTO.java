package com.connectneighbours.admindesktop.back.application.statistics;

import java.time.LocalDateTime;

public record IncidentAverageSolutionTimeDTO(Long count, LocalDateTime dateTime, Long duration) {
}
