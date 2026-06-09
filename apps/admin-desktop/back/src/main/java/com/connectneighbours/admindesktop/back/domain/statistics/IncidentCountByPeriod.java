package com.connectneighbours.admindesktop.back.domain.statistics;

import java.time.LocalDate;

public record IncidentCountByPeriod(LocalDate start, LocalDate end,Long size) {
}
