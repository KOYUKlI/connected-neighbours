package com.connectneighbours.admindesktop.back.domain.statistics;

public record ResolutionRate(
        Double rate,
        Long resolved,
        Long total
) {
}
