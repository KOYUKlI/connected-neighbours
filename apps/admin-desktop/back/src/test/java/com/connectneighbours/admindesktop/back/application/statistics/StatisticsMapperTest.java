package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRole;
import com.connectneighbours.admindesktop.back.domain.statistics.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StatisticsMapperTest {

    @Test
    void toIncidentCountByPeriodDTO_shouldMapAllFields() {
        var start = LocalDate.of(2026, 1, 1);
        var end = LocalDate.of(2026, 1, 31);
        var dto = StatisticsMapper.toIncidentCountByPeriodDTO(new IncidentCountByPeriod(start, end, 5L));

        assertEquals(start, dto.start());
        assertEquals(end, dto.end());
        assertEquals(5L, dto.count());
    }

    @Test
    void toResolutionRateDTO_shouldMapAndFormatRate() {
        var dto = StatisticsMapper.toResolutionRateDTO(new ResolutionRate(0.5, 5L, 10L));

        assertEquals("50%", dto.percentage());
        assertEquals(5L, dto.resolved());
        assertEquals(10L, dto.total());
    }

    @Test
    void toReporterActivityDTO_shouldMapAllFields() {
        var id = UUID.randomUUID();
        var dto = StatisticsMapper.toReporterActivityDTO(new ReporterActivity(id, "John", "Doe", ReporterRole.RESIDENT, 3L, 2L));

        assertEquals(id, dto.idReporter());
        assertEquals("John", dto.firstname());
        assertEquals("Doe", dto.lastname());
        assertEquals(ReporterRole.RESIDENT, dto.role());
        assertEquals(3L, dto.incidentCount());
        assertEquals(2L, dto.alertCount());
    }

    @Test
    void toIncidentDistributionByTypeDTO_shouldMapAndFormatRate() {
        var dto = StatisticsMapper.toIncidentDistributionByTypeDTO(new IncidentDistributionByType(IncidentType.SECURITY, 4L, 0.25));

        assertEquals(IncidentType.SECURITY, dto.type());
        assertEquals(4L, dto.count());
        assertEquals(0.25, dto.rate());
        assertEquals("25%", dto.percentage());
    }

    @Test
    void toAlertDistributionBySeverityDTO_shouldMapAndFormatRate() {
        var dto = StatisticsMapper.toAlertDistributionBySeverityDTO(new AlertDistributionBySeverity(AlertSeverity.CRITICAL, 2L, 0.5));

        assertEquals(AlertSeverity.CRITICAL, dto.severity());
        assertEquals(2L, dto.count());
        assertEquals(0.5, dto.rate());
        assertEquals("50%", dto.percentage());
    }

    @Test
    void toIncidentPerDayByTypeDTO_shouldMapAllFields() {
        var now = LocalDateTime.of(2026, 1, 1, 12, 0);
        var dto = StatisticsMapper.toIncidentPerDayByTypeDTO(new IncidentPerDayByType(7L, IncidentType.MAINTENANCE, now));

        assertEquals(7L, dto.count());
        assertEquals(IncidentType.MAINTENANCE, dto.type());
        assertEquals(now, dto.dateTime());
    }

    @Test
    void toIncidentAverageSolutionTimeDTO_shouldMapAllFields() {
        var now = LocalDateTime.of(2026, 1, 1, 12, 0);
        var dto = StatisticsMapper.toIncidentAverageSolutionTimeDTO(new IncidentAverageSolutionTime(3L, now, 120L));

        assertEquals(3L, dto.count());
        assertEquals(now, dto.dateTime());
        assertEquals(120L, dto.duration());
    }
}
