package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.IncidentRepositoryInMemory;
import com.connectneighbours.admindesktop.back.application.incident.IncidentMapper;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterMapper;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterRepositoryInMemory;
import com.connectneighbours.admindesktop.back.domain.alert.*;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentService;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static java.time.LocalTime.now;
import static org.junit.jupiter.api.Assertions.*;

public class AlertManagementTest {
    private AlertRepository alertRepo;
    private AlertService alertService;
    private IncidentRepository incidentRepo;
    private IncidentService incidentService;
    private ReporterRepository reporterRepo;
    private AlertManagement management;

    @BeforeEach
    void setup() {
        alertRepo = new AlertRepositoryInMemory();
        alertService = new AlertService();
        incidentRepo = new IncidentRepositoryInMemory();
        incidentService = new IncidentService();
        reporterRepo = new ReporterRepositoryInMemory();
        management = new AlertManagement(alertRepo, alertService, incidentRepo, incidentService, reporterRepo);
    }

    private ReporterDTO createReporterDTO() {
        Reporter reporter = reporterRepo.save(new Reporter("first", "last"));
        return ReporterMapper.toDTO(reporter);
    }

    private Alert createSampleAlert() {
        Alert alert = new Alert(
                null,
                "Test message",
                AlertSeverity.MEDIUM
        );
        alert.setReporter(reporterRepo.save(new Reporter("first", "last")));
        alertService.open(alert);
        return alertRepo.save(alert);
    }

    private IncidentDTO createIncidentDTO() {
        var incident = new Incident(new Reporter("first", "last"), "Leak", "Water leak", IncidentType.MAINTENANCE);
        incidentService.open(incident);
        incidentRepo.save(incident);
        return IncidentMapper.toDTO(incident);
    }

    @Test
    void addAlertToIncident_shouldAttachAlert() {
        var incident = createIncidentDTO();

        var alert = management.addAlertToIncident(
                incident.id(),
                new CreationAlertDTO(createReporterDTO(), "Broken pipe", "Pipe broken", AlertSeverity.CRITICAL)
        );

        assertEquals("Pipe broken", alert.details());
        assertEquals(1, incidentRepo.findById(incident.id()).get().getAlerts().size());
    }

    @Test
    void addAlertToIncident_shouldThrow_whenIncidentIdIsNull() {
        var dto = new CreationAlertDTO(createReporterDTO(), "title", "msg", AlertSeverity.CRITICAL);

        assertThrows(IllegalArgumentException.class,
                () -> management.addAlertToIncident(null, dto));
    }

    @Test
    void addAlertToIncident_shouldThrow_whenDtoIsNull() {
        var incident = createIncidentDTO();

        assertThrows(IllegalArgumentException.class,
                () -> management.addAlertToIncident(incident.id(), null));
    }

    @Test
    void addAlertToIncident_shouldThrow_whenMessageIsNull() {
        var incident = createIncidentDTO();

        var dto = new CreationAlertDTO(createReporterDTO(), "title", null, AlertSeverity.CRITICAL);

        assertThrows(IllegalArgumentException.class,
                () -> management.addAlertToIncident(incident.id(), dto));
    }

    @Test
    void addAlertToIncident_shouldThrow_whenMessageIsBlank() {
        var incident = createIncidentDTO();

        var dto = new CreationAlertDTO(createReporterDTO(), "title", "", AlertSeverity.CRITICAL);

        assertThrows(IllegalArgumentException.class,
                () -> management.addAlertToIncident(incident.id(), dto));
    }

    @Test
    void addAlertToIncident_shouldThrow_whenSeverityIsNull() {
        var incident = createIncidentDTO();

        var dto = new CreationAlertDTO(createReporterDTO(), "title", "msg", null);

        assertThrows(IllegalArgumentException.class,
                () -> management.addAlertToIncident(incident.id(), dto));
    }

    @Test
    void detachAlert_shouldRemoveAlertFromIncident() {
        var incident = createIncidentDTO();
        var incidentEntity = incidentRepo.findById(incident.id()).get();

        var alertEntity = new Alert(incidentEntity, "Pipe broken", AlertSeverity.CRITICAL);
        alertService.open(alertEntity);
        incidentService.attachAlert(incidentEntity, alertEntity);
        alertRepo.save(alertEntity);
        incidentRepo.save(incidentEntity);

        alertService.resolve(alertEntity);
        alertRepo.save(alertEntity);

        management.detachAlertFromIncident(incident.id(), alertEntity.getAlertId());

        var updated = incidentRepo.findById(incident.id()).get();
        assertEquals(0, updated.getAlerts().size());
    }

    @Test
    void detachAlert_shouldThrow_whenIncidentIdIsNull() {
        var alertId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class,
                () -> management.detachAlertFromIncident(null, alertId));
    }

    @Test
    void detachAlert_shouldThrow_whenAlertIdIsNull() {
        var incident = createIncidentDTO();

        assertThrows(IllegalArgumentException.class,
                () -> management.detachAlertFromIncident(incident.id(), null));
    }

    @Test
    void resolveAlert_shouldSetStatusToResolved() {
        Alert alert = createSampleAlert();

        AlertDTO dto = management.resolveAlert(alert.getAlertId());

        assertEquals(AlertStatus.RESOLVED, dto.status());
        assertEquals(AlertStatus.RESOLVED, alertRepo.findById(alert.getAlertId()).get().getStatus());
    }

    @Test
    void resolveAlert_shouldThrowIfNotFound() {
        UUID unknown = UUID.randomUUID();
        assertThrows(AlertNotFoundException.class, () -> management.resolveAlert(unknown));
    }

    @Test
    void updateAlert_shouldModifyMessageAndSeverity() {
        Alert alert = createSampleAlert();

        UpdateAlertDTO dto = new UpdateAlertDTO("Updated message", AlertSeverity.CRITICAL);

        AlertDTO updated = management.updateAlert(alert.getAlertId(), dto);

        assertEquals("Updated message", updated.details());
        assertEquals(AlertSeverity.CRITICAL, updated.severity());
    }

    @Test
    void updateAlert_shouldThrowIfNotFound() {
        UUID unknown = UUID.randomUUID();
        UpdateAlertDTO dto = new UpdateAlertDTO("msg", AlertSeverity.LOW);

        assertThrows(AlertNotFoundException.class, () -> management.updateAlert(unknown, dto));
    }

    @Test
    void listAlerts_shouldReturnAllAlerts() {
        createSampleAlert();
        createSampleAlert();

        List<AlertDTO> list = management.listAlerts();

        assertEquals(2, list.size());
    }

    @Test
    void listBySeverity_shouldFilterCorrectly() {
        Alert a1 = createSampleAlert();
        Alert a2 = createSampleAlert();

        a1.setSeverity(AlertSeverity.CRITICAL);
        alertRepo.save(a1);

        a2.setSeverity(AlertSeverity.LOW);
        alertRepo.save(a2);

        List<AlertDTO> critical = management.listBySeverity(AlertSeverity.CRITICAL);

        assertEquals(1, critical.size());
        assertEquals(AlertSeverity.CRITICAL, critical.get(0).severity());
    }

    @Test
    void listByStatus_shouldFilterCorrectly() {
        Alert a1 = createSampleAlert();

        alertService.resolve(a1);
        alertRepo.save(a1);

        List<AlertDTO> resolved = management.listByStatus(AlertStatus.RESOLVED);

        assertEquals(1, resolved.size());
        assertEquals(AlertStatus.RESOLVED, resolved.get(0).status());
    }

    @Test
    void listByIncident_shouldReturnAlertsForGivenIncident() {
        var incidentService = new IncidentService();

        var incident = new Incident(
                new Reporter("first", "last"),
                "Leak",
                "Water leak",
                IncidentType.MAINTENANCE
        );
        incidentService.open(incident);
        incidentRepo.save(incident);

        var alert1 = new Alert(incident, "A1", AlertSeverity.CRITICAL);
        alert1.setReporter(new Reporter("first", "last"));
        alertService.open(alert1);
        alertRepo.save(alert1);

        var alert2 = new Alert(incident, "A2", AlertSeverity.LOW);
        alert2.setReporter(new Reporter("first", "last"));
        alertService.open(alert2);
        alertRepo.save(alert2);

        var otherIncident = new Incident(
                new Reporter("x", "y"),
                "Other",
                "Other desc",
                IncidentType.SECURITY
        );
        incidentService.open(otherIncident);
        incidentRepo.save(otherIncident);

        var alertOther = new Alert(otherIncident, "B1", AlertSeverity.MEDIUM);
        alertOther.setReporter(new Reporter("x", "y"));
        alertService.open(alertOther);
        alertRepo.save(alertOther);

        var list = management.listByIncident(IncidentMapper.toDTO(incident));

        assertEquals(2, list.size());
        assertTrue(list.stream().anyMatch(a -> a.details().equals("A1")));
        assertTrue(list.stream().anyMatch(a -> a.details().equals("A2")));
    }

    @Test
    void findByReporter_returnsEmptyList_whenNoAlerts() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var result = alertRepo.findByReporter(reporter1);
        assertTrue(result.isEmpty());
    }

    @Test
    void findByReporter_returnsOnlyAlertsOfGivenReporter() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var reporter2 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "Alice",
                "Smith"
        );

        var a1 = new Alert(null, "msg", AlertSeverity.HIGH);
        a1.setReporter(reporter1);
        a1.setCreatedAt(LocalDateTime.now());
        a1.setResolvedAt(LocalDateTime.now());

        var a2 = new Alert(null, "msg", AlertSeverity.LOW);
        a2.setReporter(reporter1);
        a2.setCreatedAt(LocalDateTime.now());
        a2.setResolvedAt(LocalDateTime.now());

        var a3 = new Alert(null, "msg", AlertSeverity.MEDIUM);
        a3.setReporter(reporter2);
        a3.setCreatedAt(LocalDateTime.now());
        a3.setResolvedAt(LocalDateTime.now());

        alertRepo.save(a1);
        alertRepo.save(a2);
        alertRepo.save(a3);

        var result = alertRepo.findByReporter(reporter1);

        assertEquals(2, result.size());
        assertTrue(result.contains(a1));
        assertTrue(result.contains(a2));
        assertFalse(result.contains(a3));
    }

    @Test
    void findByReporter_returnsEmptyList_whenReporterHasNoAlerts() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var reporter2 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "Alice",
                "Smith"
        );

        var a1 = new Alert(null, "msg", AlertSeverity.HIGH);
        a1.setReporter(reporter1);
        a1.setCreatedAt(LocalDateTime.now());
        a1.setResolvedAt(LocalDateTime.now());

        alertRepo.save(a1);

        var result = alertRepo.findByReporter(reporter2);

        assertTrue(result.isEmpty());
    }

    @Test
    void findByReporter_doesNotReturnAlertsOfOtherReporter() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var reporter2 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "Alice",
                "Smith"
        );

        var a1 = new Alert(null, "msg", AlertSeverity.HIGH);
        a1.setReporter(reporter1);
        a1.setCreatedAt(LocalDateTime.now());
        a1.setResolvedAt(LocalDateTime.now());

        var a2 = new Alert(null, "msg", AlertSeverity.HIGH);
        a2.setReporter(reporter2);
        a2.setCreatedAt(LocalDateTime.now());
        a2.setResolvedAt(LocalDateTime.now());

        alertRepo.save(a1);
        alertRepo.save(a2);

        var result = alertRepo.findByReporter(reporter1);

        assertEquals(1, result.size());
        assertTrue(result.contains(a1));
        assertFalse(result.contains(a2));
    }


}
