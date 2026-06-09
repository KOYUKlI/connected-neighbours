package com.connectneighbours.admindesktop.back.application.statistics;

import java.time.LocalDate;

public record IncidentCountByPeriodDTO(LocalDate start, LocalDate end, Long size) {
}
