package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.statistics.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class StatisticsManagementTest {
    private StatisticsService service;
    private StatisticsManagement management;

    @BeforeEach
    void setUp() {
        service = mock(StatisticsService.class);
        management = new StatisticsManagement(service);
    }

    @Test
    void countIncidents_returnsMappedDTO() {
        var domain = new IncidentCountByPeriod(LocalDate.now(), LocalDate.now(), 5L);
        when(service.countIncidents(any(), any())).thenReturn(domain);

        var dto = management.countIncidents(LocalDate.now(), LocalDate.now());

        assertEquals(domain.count(), dto.count());
        assertEquals(domain.start(), dto.start());
        assertEquals(domain.end(), dto.end());
    }

    @Test
    void resolutionRate_returnsMappedDTO() {
        var domain = new ResolutionRate(0.5, 5L, 10L);
        when(service.resolutionRate()).thenReturn(domain);

        var dto = management.resolutionRate();

        assertEquals("50%", dto.percentage());
        assertEquals(5L, dto.resolved());
        assertEquals(10L, dto.total());
    }


    @Test
    void reporterActivity_returnsMappedList() {
        var domainList = List.of(
                new ReporterActivity(UUID.randomUUID(), "John", "Doe", 3L, 1L),
                new ReporterActivity(UUID.randomUUID(), "Alice", "Smith", 0L, 2L)
        );

        when(service.reporterActivity()).thenReturn(domainList);

        var dtoList = management.reporterActivity();

        assertEquals(2, dtoList.size());
        assertEquals("John", dtoList.get(0).firstname());
        assertEquals(3L, dtoList.get(0).incidentCount());
        assertEquals(2L, dtoList.get(1).alertCount());
    }

    @Test
    void incidentCountByPeriod_returnsMappedDTO() {
        var domain = new IncidentDistributionByType(IncidentType.SECURITY, 4L, 0.4);
        when(service.incidentDistributionByType(IncidentType.SECURITY)).thenReturn(domain);

        var dto = management.incidentCountByPeriod(IncidentType.SECURITY);

        assertEquals(domain.type(), dto.type());
        assertEquals(domain.count(), dto.count());
        assertEquals("40%", dto.percentage());
    }

    @Test
    void listIncidentDistributedByType_returnsMappedList() {
        var domainList = List.of(
                new IncidentDistributionByType(IncidentType.SECURITY, 2L, 0.2),
                new IncidentDistributionByType(IncidentType.CLEANLINESS, 3L, 0.3)
        );

        when(service.listIncidentDistributedByType()).thenReturn(domainList);

        var dtoList = management.listIncidentDistributedByType();

        assertEquals(2, dtoList.size());
        assertEquals("20%", dtoList.get(0).percentage());
        assertEquals("30%", dtoList.get(1).percentage());
    }

    @Test
    void alertDistributionBySeverity_returnsMappedDTO() {
        var domain = new AlertDistributionBySeverity(
                AlertSeverity.CRITICAL,
                5L,
                0.5
        );

        Mockito.when(service.alertDistributionBySeverity(AlertSeverity.CRITICAL))
                .thenReturn(domain);

        var dto = management.alertDistributionBySeverity(AlertSeverity.CRITICAL);

        assertEquals(AlertSeverity.CRITICAL, dto.severity());
        assertEquals(5L, dto.count());
        assertEquals("50%", dto.percentage());
    }

    @Test
    void listAlertDistributionBySeverity_returnsMappedDTOList() {
        var domainList = List.of(
                new AlertDistributionBySeverity(AlertSeverity.CRITICAL, 2L, 0.2),
                new AlertDistributionBySeverity(AlertSeverity.LOW, 3L, 0.3)
        );

        Mockito.when(service.listAlertDistributionBySeverity())
                .thenReturn(domainList);

        var dtoList = management.listAlertDistributionBySeverity();

        assertEquals(2, dtoList.size());

        var d1 = dtoList.get(0);
        assertEquals(AlertSeverity.CRITICAL, d1.severity());
        assertEquals(2L, d1.count());
        assertEquals("20%", d1.percentage());

        var d2 = dtoList.get(1);
        assertEquals(AlertSeverity.LOW, d2.severity());
        assertEquals(3L, d2.count());
        assertEquals("30%", d2.percentage());
    }


}
