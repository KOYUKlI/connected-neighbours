package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.incident.service.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.UpdateAlertDTO;
import com.connectneighbours.admindesktop.back.domain.alert.*;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class AlertManagementTest {
    private AlertRepository alertRepo;
    private AlertService alertService;
    private AlertManagement management;

    @BeforeEach
    void setup() {
        alertRepo = new AlertRepositoryInMemory();
        alertService = new AlertService();
        management = new AlertManagement(alertRepo,alertService);
    }
    private Alert createSampleAlert() {
        Alert alert = new Alert(
                null,
                "Test message",
                Severity.MEDIUM
        );
        alertService.open(alert);
        return alertRepo.save(alert);
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

        UpdateAlertDTO dto = new UpdateAlertDTO("Updated message", Severity.CRITICAL);

        AlertDTO updated = management.updateAlert(alert.getAlertId(), dto);

        assertEquals("Updated message", updated.message());
        assertEquals(Severity.CRITICAL, updated.severity());
    }

    @Test
    void updateAlert_shouldThrowIfNotFound() {
        UUID unknown = UUID.randomUUID();
        UpdateAlertDTO dto = new UpdateAlertDTO("msg", Severity.LOW);

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

        a1.setSeverity(Severity.CRITICAL);
        alertRepo.save(a1);

        a2.setSeverity(Severity.LOW);
        alertRepo.save(a2);

        List<AlertDTO> critical = management.listBySeverity(Severity.CRITICAL);

        assertEquals(1, critical.size());
        assertEquals(Severity.CRITICAL, critical.get(0).severity());
    }

    @Test
    void listByStatus_shouldFilterCorrectly() {
        Alert a1 = createSampleAlert();
        Alert a2 = createSampleAlert();

        alertService.resolve(a1);
        alertRepo.save(a1);

        List<AlertDTO> resolved = management.listByStatus(AlertStatus.RESOLVED);

        assertEquals(1, resolved.size());
        assertEquals(AlertStatus.RESOLVED, resolved.get(0).status());
    }
}
