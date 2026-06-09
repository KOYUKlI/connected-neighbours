package com.connectneighbours.admindesktop.back.domain.statistics;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ResolutionRate(
        Double rate,
        Long resolved,
        Long total
) {
}
