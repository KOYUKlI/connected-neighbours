package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.service.CreationIncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.service.UpdateIncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.CreationAlertDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.UpdateAlertDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertService;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentDeletionNotAllowedException;
import com.connectneighbours.admindesktop.back.domain.incident.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;

class IncidentManagementTest {

    private IncidentRepository incidentRepo;
    private AlertRepository alertRepo;
    private IncidentService incidentService;
    private AlertService alertService;
    private IncidentManagement management;

    @BeforeEach
    void setup() {
        incidentRepo = new IncidentRepositoryInMemory();
        alertRepo = new AlertRepositoryInMemory();
        incidentService = new IncidentService();
        alertService = new AlertService();
        management = new IncidentManagement(alertRepo, incidentRepo, alertService, incidentService);
    }

    @Test
    void createIncident_shouldCreateAndReturnDTO() {
        var dto = new CreationIncidentDTO("Fire", "Kitchen fire", IncidentType.MAINTENANCE);

        var result = management.createIncident(dto);

        assertEquals("Fire", result.title());
        assertEquals(IncidentStatus.OPEN, result.status());
        assertEquals(1, incidentRepo.findAll().size());
    }

    @Test
    void updateIncident_shouldModifyFields() {
        var incident = management.createIncident(
                new CreationIncidentDTO("Old", "Desc", IncidentType.MAINTENANCE)
        );

        var updated = management.updateIncident(
                incident.id(),
                new UpdateIncidentDTO("NewTitle", "NewDesc", IncidentType.MAINTENANCE)
        );

        assertEquals("NewTitle", updated.title());
        assertEquals("NewDesc", updated.description());
        assertEquals(IncidentType.MAINTENANCE, updated.type());
    }

    @Test
    void addAlertToIncident_shouldAttachAlert() {
        var incident = management.createIncident(
                new CreationIncidentDTO("Leak", "Water leak", IncidentType.MAINTENANCE)
        );

        var alert = management.addAlertToIncident(
                incident.id(),
                new CreationAlertDTO("Pipe broken", Severity.CRITICAL)
        );

        assertEquals("Pipe broken", alert.message());
        assertEquals(1, incidentRepo.findById(incident.id()).get().getAlerts().size());
    }

    @Test
    void updateAlert_shouldModifyFields() {
        var incident = management.createIncident(
                new CreationIncidentDTO("Leak", "Water leak", IncidentType.MAINTENANCE)
        );

        var alert = management.addAlertToIncident(
                incident.id(),
                new CreationAlertDTO("Pipe broken", Severity.LOW)
        );

        var updated = management.updateAlert(
                alert.id(),
                new UpdateAlertDTO("Updated msg", Severity.CRITICAL)
        );

        assertEquals("Updated msg", updated.message());
        assertEquals(Severity.CRITICAL, updated.severity());
    }

    @Test
    void resolveAlert_shouldSetStatusToResolved() {
        var incident = management.createIncident(
                new CreationIncidentDTO("Leak", "Water leak", IncidentType.MAINTENANCE)
        );

        var alert = management.addAlertToIncident(
                incident.id(),
                new CreationAlertDTO("Pipe broken", Severity.LOW)
        );

        var resolved = management.resolveAlert(alert.id());

        assertEquals(AlertStatus.RESOLVED, resolved.status());
    }

    @Test
    void detachAlert_shouldRemoveAlertFromIncident() {
        var incident = management.createIncident(
                new CreationIncidentDTO("Leak", "Water leak", IncidentType.MAINTENANCE)
        );

        var alert = management.addAlertToIncident(
                incident.id(),
                new CreationAlertDTO("Pipe broken", Severity.CRITICAL)
        );

        management.resolveAlert(alert.id());
        management.detachAlertFromIncident(incident.id(), alert.id());

        var updated = incidentRepo.findById(incident.id()).get();
        assertEquals(0, updated.getAlerts().size());
    }

    @Test
    void listIncidents_shouldReturnPaginatedResults() {
        for (int i = 0; i < 15; i++) {
            management.createIncident(
                    new CreationIncidentDTO("i" + i, "desc", IncidentType.MAINTENANCE)
            );
        }

        var page0 = management.listIncidents(0, 10);
        var page1 = management.listIncidents(1, 10);

        assertEquals(10, page0.size());
        assertEquals(5, page1.size());
    }

    @Test
    void listByStatus_shouldReturnMatchingIncidents() {
        var i1 = new Incident("t1", "d1", IncidentType.MAINTENANCE);
        i1.resolve();
        incidentRepo.save(i1);

        var i2 = new Incident("t2", "d2", IncidentType.MAINTENANCE);
        incidentRepo.save(i2);

        var result = management.listByStatus(IncidentStatus.RESOLVED);

        assertThat(result).containsExactly(i1);
    }

    @Test
    void listByType_shouldReturnMatchingIncidents() {
        var i1 = new Incident("t1", "d1", IncidentType.MAINTENANCE);
        var i2 = new Incident("t2", "d2", IncidentType.MAINTENANCE);
        incidentRepo.save(i1);
        incidentRepo.save(i2);

        var result = management.listByType(IncidentType.MAINTENANCE);

        assertThat(result).containsExactly(i1);
    }



    @Test
    void getIncident_shouldReturnCorrectIncident() {
        var incident = management.createIncident(
                new CreationIncidentDTO("Fire", "Kitchen", IncidentType.MAINTENANCE)
        );

        var result = management.getIncident(incident.id());

        assertEquals("Fire", result.title());
        assertEquals("Kitchen", result.description());
    }

    @Test
    void listByDateRange_shouldReturnMatchingIncidents() {
        var clock = Clock.fixed(Instant.parse("2024-01-10T00:00:00Z"), ZoneOffset.UTC);
        var now = LocalDateTime.now(clock);

        var i1 = new Incident("t1", "d1", IncidentType.MAINTENANCE, clock);
        incidentRepo.save(i1);

        var i2 = new Incident("t2", "d2", IncidentType.MAINTENANCE, clock);
        incidentRepo.save(i2);

        var result = management.listByDateRange(
                now.minusDays(1),
                now
        );

        assertThat(result).containsExactly(i1, i2);
    }


    @Test
    void deleteIncident_shouldDelete_whenStatusIsResolved() {

        var incident = new Incident("t", "d", IncidentType.MAINTENANCE);
        incident.resolve();
        incidentRepo.save(incident);


        management.deleteIncident(incident.getIncidentId());


        assertThat(incidentRepo.findById(incident.getIncidentId())).isEmpty();
    }

    @Test
    void deleteIncident_shouldDelete_whenStatusIsClosed() {
        var incident = new Incident("t", "d", IncidentType.MAINTENANCE);
        incident.close();
        incidentRepo.save(incident);

        management.deleteIncident(incident.getIncidentId());

        assertThat(incidentRepo.findById(incident.getIncidentId())).isEmpty();
    }

    @Test
    void deleteIncident_shouldThrow_whenStatusIsOpen() {
        var incident = new Incident("t", "d", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        assertThatThrownBy(() -> management.deleteIncident(incident.getIncidentId()))
                .isInstanceOf(IncidentDeletionNotAllowedException.class)
                .hasMessageContaining("must be resolved or closed");
    }


}
