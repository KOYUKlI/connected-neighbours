package com.connectneighbours.admindesktop.back.infrastructure;

import com.connectneighbours.admindesktop.back.application.incident.IncidentRepositoryInMemory;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertRepositoryInMemory;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterRepositoryInMemory;
import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import com.connectneighbours.admindesktop.back.infrastructure.statistics.StatisticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class StatisticsServiceImplTest {
    private IncidentRepository incidentRepo;
    private AlertRepository alertRepo;
    private ReporterRepository reporterRepo;
    private StatisticsServiceImpl service;
    private Clock clock;

    @BeforeEach
    void setup() {
        clock = Clock.fixed(Instant.now(), ZoneId.systemDefault());
        incidentRepo = new IncidentRepositoryInMemory();
        alertRepo = new AlertRepositoryInMemory();
        reporterRepo = new ReporterRepositoryInMemory();
        service = new StatisticsServiceImpl(incidentRepo, alertRepo, reporterRepo);

    }

    @Test
    void countIncidents_returnsZero_whenNoIncidentsInPeriod() {
        var start = LocalDate.now().minusDays(5);
        var end = LocalDate.now();

        var result = service.countIncidents(start, end);

        assertEquals(0, result.count());
    }

    @Test
    void countIncidents_countsOnlyIncidentsInPeriod() {
        var r = new Reporter(LocalDateTime.now(), LocalDateTime.now(), "A", "B");

        var i1 = new Incident(r, "t1", "d1", IncidentType.SECURITY, clock);
        incidentRepo.save(i1);

        var i2 = new Incident(r, "t2", "d2", IncidentType.SECURITY, clock);
        incidentRepo.save(i2);

        var start = LocalDate.now().minusDays(1);
        var end = LocalDate.now().plusDays(1);

        var result = service.countIncidents(start, end);

        assertEquals(2, result.count());
    }

    @Test
    void resolutionRate_returnsZero_whenNoIncidents() {
        var result = service.resolutionRate();
        assertEquals(0.0, result.rate());
        assertEquals(0, result.resolved());
        assertEquals(0, result.total());
    }

    @Test
    void resolutionRate_returnsCorrectValues() {
        var r = new Reporter( LocalDateTime.now(), LocalDateTime.now(), "A", "B");

        var i1 = new Incident(r, "t1", "d1", IncidentType.SECURITY, clock);
        var i2 = new Incident(r, "t2", "d2", IncidentType.SECURITY, clock);
        var i3 = new Incident(r, "t3", "d3", IncidentType.SECURITY, clock);

        i1.resolve();
        i3.resolve();

        incidentRepo.save(i1);
        incidentRepo.save(i2);
        incidentRepo.save(i3);

        var result = service.resolutionRate();

        assertEquals(2.0 / 3.0, result.rate());
        assertEquals(2, result.resolved());
        assertEquals(3, result.total());
    }

    @Test
    void reporterActivity_returnsEmpty_whenNoReporters() {
        var result = service.reporterActivity();
        assertTrue(result.isEmpty());
    }

    @Test
    void reporterActivity_returnsCorrectCounts() {
        var r1 = new Reporter(LocalDateTime.now(), LocalDateTime.now(), "John", "Doe");
        var r2 = new Reporter(LocalDateTime.now(), LocalDateTime.now(), "Alice", "Smith");

        reporterRepo.save(r1);
        reporterRepo.save(r2);

        var i1 = new Incident(r1, "t1", "d1", IncidentType.SECURITY, clock);
        var i2 = new Incident(r1, "t2", "d2", IncidentType.SECURITY, clock);
        incidentRepo.save(i1);
        incidentRepo.save(i2);

        var a1 = new Alert(i1, "msg", Severity.HIGH);
        a1.setReporter(r1);
        alertRepo.save(a1);

        var result = service.reporterActivity();

        var ra1 = result.stream().filter(r -> r.idReporter().equals(r1.getIdReporter())).findFirst().orElseThrow();
        assertEquals(2, ra1.incidentCount());
        assertEquals(1, ra1.alertCount());

        var ra2 = result.stream().filter(r -> r.idReporter().equals(r2.getIdReporter())).findFirst().orElseThrow();
        assertEquals(0, ra2.incidentCount());
        assertEquals(0, ra2.alertCount());
    }

    @Test
    void incidentDistributionByType_returnsZero_whenNoIncidents() {
        var result = service.incidentDistributionByType(IncidentType.SECURITY);
        assertEquals(0, result.count());
        assertEquals(0.0, result.rate());
    }

    @Test
    void incidentDistributionByType_returnsCorrectValues() {
        var r = new Reporter(LocalDateTime.now(),LocalDateTime.now(), "A", "B");

        var i1 = new Incident(r, "t1", "d1", IncidentType.SECURITY, clock);
        var i2 = new Incident(r, "t2", "d2", IncidentType.SECURITY, clock);
        var i3 = new Incident(r, "t3", "d3", IncidentType.CLEANLINESS, clock);

        incidentRepo.save(i1);
        incidentRepo.save(i2);
        incidentRepo.save(i3);

        var result = service.incidentDistributionByType(IncidentType.SECURITY);

        assertEquals(2, result.count());
        assertEquals(2.0 / 3.0, result.rate());
    }


    @Test
    void listIncidentDistributedByType_returnsAllTypes() {
        var result = service.listIncidentDistributedByType();
        assertEquals(IncidentType.values().length, result.size());
    }

    @Test
    void listIncidentDistributedByType_valuesMatchIndividualCalls() {
        var list = service.listIncidentDistributedByType();

        for (var type : IncidentType.values()) {
            var single = service.incidentDistributionByType(type);
            var fromList = list.stream()
                    .filter(d -> d.type().equals(type))
                    .findFirst()
                    .orElseThrow();

            assertEquals(single.count(), fromList.count());
            assertEquals(single.rate(), fromList.rate());
        }
    }
}
