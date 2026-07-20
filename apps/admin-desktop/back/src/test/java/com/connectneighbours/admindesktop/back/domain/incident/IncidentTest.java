package com.connectneighbours.admindesktop.back.domain.incident;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class IncidentTest {

    private Incident newIncident() {
        return new Incident(new Reporter("first", "last"), "Leak", "Water leak", IncidentType.MAINTENANCE);
    }

    private Alert alertWith(Incident incident, AlertSeverity severity) {
        return new Alert(incident, new Reporter("first", "last"), "title", "details", severity);
    }

    @Test
    void newIncident_shouldStartAsCreated() {
        var incident = newIncident();
        assertEquals(IncidentStatus.CREATED, incident.getStatus());
    }

    @Test
    void resolve_shouldSetStatusToResolvedAndSetResolvedAt() {
        var incident = newIncident();

        incident.resolve();

        assertTrue(incident.isResolved());
        assertNotNull(incident.getResolvedAt());
    }

    @Test
    void open_shouldSetStatusToOpenAndClearResolvedAt() {
        var incident = newIncident();
        incident.resolve();

        incident.open();

        assertTrue(incident.isOpen());
        assertNull(incident.getResolvedAt());
    }

    @Test
    void inProgress_shouldSetStatusToInProgressAndClearResolvedAt() {
        var incident = newIncident();
        incident.resolve();

        incident.inProgress();

        assertTrue(incident.isInProgress());
        assertNull(incident.getResolvedAt());
    }

    @Test
    void close_shouldSetStatusToClosedAndSetResolvedAt() {
        var incident = newIncident();

        incident.close();

        assertTrue(incident.isClosed());
        assertNotNull(incident.getResolvedAt());
    }

    @Test
    void hasCriticalOpenAlerts_shouldBeFalse_whenNoAlerts() {
        var incident = newIncident();
        assertFalse(incident.hasCriticalOpenAlerts());
    }

    @Test
    void hasCriticalOpenAlerts_shouldBeFalse_whenOnlyNonCriticalAlertIsInProgress() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.LOW);
        alert.inProgress();
        incident.getAlerts().add(alert);

        assertFalse(incident.hasCriticalOpenAlerts());
    }

    @Test
    void hasCriticalOpenAlerts_shouldBeTrue_whenCriticalAlertIsOpen() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.CRITICAL);
        alert.open();
        incident.getAlerts().add(alert);

        assertTrue(incident.hasCriticalOpenAlerts());
    }

    @Test
    void hasCriticalOpenAlerts_shouldBeTrue_whenCriticalAlertIsInProgress() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.CRITICAL);
        alert.inProgress();
        incident.getAlerts().add(alert);

        assertTrue(incident.hasCriticalOpenAlerts());
    }

    @Test
    void hasCriticalOpenAlerts_shouldBeFalse_whenCriticalAlertIsResolved() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.CRITICAL);
        alert.resolve();
        incident.getAlerts().add(alert);

        assertFalse(incident.hasCriticalOpenAlerts());
    }

    @Test
    void hasCriticalOpenAlerts_shouldBeFalse_whenCriticalAlertIsClosed() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.CRITICAL);
        alert.close();
        incident.getAlerts().add(alert);

        assertFalse(incident.hasCriticalOpenAlerts());
    }
}
