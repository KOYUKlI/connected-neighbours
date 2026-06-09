package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.application.incident.alert.AlertRepositoryInMemory;
import com.connectneighbours.admindesktop.back.application.incident.service.CreationIncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.service.IncidentMapper;
import com.connectneighbours.admindesktop.back.application.incident.service.UpdateIncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.CreationAlertDTO;
import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertService;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentDeletionNotAllowedException;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.*;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
    void startIncidentProgress_shouldSetStatusToInProgress() {
        var incident = management.createIncident(
                new CreationIncidentDTO(
                        new Reporter("first", "last"),
                        "Leak",
                        "Water leak",
                        IncidentType.MAINTENANCE
                )
        );

        var updated = management.startIncidentProgress(incident.id());

        assertEquals(IncidentStatus.IN_PROGRESS, updated.status());
        assertEquals(IncidentStatus.IN_PROGRESS, incidentRepo.findById(incident.id()).get().getStatus());
    }

    @Test
    void startIncidentProgress_shouldThrowIfIncidentNotFound() {
        UUID unknown = UUID.randomUUID();
        assertThrows(IncidentNotFoundException.class, () -> management.startIncidentProgress(unknown));
    }

    @Test
    void resolveIncident_shouldSetStatusToResolved() {
        var incident = management.createIncident(
                new CreationIncidentDTO(
                        new Reporter("first", "last"),
                        "Leak",
                        "Water leak",
                        IncidentType.MAINTENANCE
                )
        );

        var updated = management.resolveIncident(incident.id());

        assertEquals(IncidentStatus.RESOLVED, updated.status());
        assertEquals(IncidentStatus.RESOLVED, incidentRepo.findById(incident.id()).get().getStatus());
    }

    @Test
    void resolveIncident_shouldThrowIfIncidentNotFound() {
        UUID unknown = UUID.randomUUID();
        assertThrows(IncidentNotFoundException.class, () -> management.resolveIncident(unknown));
    }


    @Test
    void createIncident_shouldCreateAndReturnDTO() {
        var dto = new CreationIncidentDTO(new Reporter("first","last"),"Fire", "Kitchen fire", IncidentType.MAINTENANCE);

        var result = management.createIncident(dto);

        assertEquals("Fire", result.title());
        assertEquals(IncidentStatus.OPEN, result.status());
        assertEquals(1, incidentRepo.findAll().size());
    }

    @Test
    void updateIncident_shouldModifyFields() {
        var incident = management.createIncident(
                new CreationIncidentDTO(new Reporter("first","last"),"Old", "Desc", IncidentType.MAINTENANCE)
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
                new CreationIncidentDTO(new Reporter("first","last"),"Leak", "Water leak", IncidentType.MAINTENANCE)
        );

        var alert = management.addAlertToIncident(
                incident.id(),
                new CreationAlertDTO("Pipe broken", Severity.CRITICAL)
        );

        assertEquals("Pipe broken", alert.message());
        assertEquals(1, incidentRepo.findById(incident.id()).get().getAlerts().size());
    }


    @Test
    void detachAlert_shouldRemoveAlertFromIncident() {
        var incident = management.createIncident(
                new CreationIncidentDTO(new Reporter("first","last"),"Leak", "Water leak", IncidentType.MAINTENANCE)
        );

        var alert = management.addAlertToIncident(
                incident.id(),
                new CreationAlertDTO("Pipe broken", Severity.CRITICAL)
        );

        Alert alertEntity = alertRepo.findById(alert.id()).get();
        alertService.resolve(alertEntity);
        alertRepo.save(alertEntity);

        management.detachAlertFromIncident(incident.id(), alert.id());

        var updated = incidentRepo.findById(incident.id()).get();
        assertEquals(0, updated.getAlerts().size());
    }

    @Test
    void listIncidents_shouldReturnPaginatedResults() {
        for (int i = 0; i < 15; i++) {
            management.createIncident(
                    new CreationIncidentDTO(new Reporter("first","last"),"i" + i, "desc", IncidentType.MAINTENANCE)
            );
        }

        var page0 = management.listIncidents(0, 10);
        var page1 = management.listIncidents(1, 10);

        assertEquals(10, page0.size());
        assertEquals(5, page1.size());
    }

    @Test
    void listByStatus_shouldReturnMatchingIncidents() {
        var i1 = new Incident(new Reporter("first","last"), "t1", "d1", IncidentType.MAINTENANCE);
        i1.resolve();
        incidentRepo.save(i1);

        var i2 = new Incident(new Reporter("first","last"), "t2", "d2", IncidentType.MAINTENANCE);
        incidentRepo.save(i2);

        var result = management.listByStatus(IncidentStatus.RESOLVED);
        var i1Dto = IncidentMapper.toDTO(i1);

        assertThat(result).containsExactly(i1Dto);
    }

    @Test
    void listByType_shouldReturnMatchingIncidents() {
        var i1 = new Incident(new Reporter("first","last"), "t1", "d1", IncidentType.MAINTENANCE);
        var i2 = new Incident(new Reporter("first","last"), "t2", "d2", IncidentType.MAINTENANCE);
        incidentRepo.save(i1);
        incidentRepo.save(i2);

        var result = management.listByType(IncidentType.MAINTENANCE);

        var i1Dto = IncidentMapper.toDTO(i1);
        var i2Dto = IncidentMapper.toDTO(i2);

        assertThat(result).containsExactly(i1Dto,i2Dto);
    }



    @Test
    void getIncident_shouldReturnCorrectIncident() {
        var incident = management.createIncident(
                new CreationIncidentDTO(new Reporter("first","last"),"Fire", "Kitchen", IncidentType.MAINTENANCE)
        );

        var result = management.getIncident(incident.id());

        assertEquals("Fire", result.title());
        assertEquals("Kitchen", result.description());
    }

    @Test
    void listByDateRange_shouldReturnMatchingIncidents() {
        var clock = Clock.fixed(Instant.parse("2024-01-10T00:00:00Z"), ZoneOffset.UTC);
        var now = LocalDateTime.now(clock);

        var i1 = new Incident(new Reporter("first","last"),"t1", "d1", IncidentType.MAINTENANCE, clock);
        incidentRepo.save(i1);

        var i2 = new Incident(new Reporter("first","last"),"t2", "d2", IncidentType.MAINTENANCE, clock);
        incidentRepo.save(i2);

        var result = management.listByDateRange(
                now.minusDays(1),
                now.plusSeconds(1)
        );

        var i1Dto = IncidentMapper.toDTO(i1);
        var i2Dto = IncidentMapper.toDTO(i2);

        assertThat(result).containsExactly(i1Dto,i2Dto);
    }


    @Test
    void deleteIncident_shouldDelete_whenStatusIsResolved() {

        var incident = new Incident(new Reporter("first","last"), "t", "d", IncidentType.MAINTENANCE);
        incident.resolve();
        incidentRepo.save(incident);


        management.deleteIncident(incident.getIncidentId());


        assertThat(incidentRepo.findById(incident.getIncidentId())).isEmpty();
    }

    @Test
    void deleteIncident_shouldDelete_whenStatusIsClosed() {
        var incident = new Incident(new Reporter("first","last"), "t", "d", IncidentType.MAINTENANCE);
        incident.close();
        incidentRepo.save(incident);

        management.deleteIncident(incident.getIncidentId());

        assertThat(incidentRepo.findById(incident.getIncidentId())).isEmpty();
    }

    @Test
    void deleteIncident_shouldThrow_whenStatusIsOpen() {
        var incident = new Incident(new Reporter("first","last"), "t", "d", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        assertThatThrownBy(() -> management.deleteIncident(incident.getIncidentId()))
                .isInstanceOf(IncidentDeletionNotAllowedException.class)
                .hasMessageContaining("must be resolved or closed");
    }


}
