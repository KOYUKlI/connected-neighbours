package com.connectneighbours.admindesktop.back.application.statistics;

public record ResolutionRateDTO(
        String percentage,
        Long resolved,
        Long total
) {
}
