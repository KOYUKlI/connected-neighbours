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
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentService;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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
    void getIncident_shouldReturnCorrectIncident() {
        var incident = management.createIncident(
                new CreationIncidentDTO("Fire", "Kitchen", IncidentType.MAINTENANCE)
        );

        var result = management.getIncident(incident.id());

        assertEquals("Fire", result.title());
        assertEquals("Kitchen", result.description());
    }
}
