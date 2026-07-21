package com.connectneighbours.admindesktop.back.domain.alert;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AlertTest {

    private Incident incident() {
        return new Incident(new Reporter("first", "last"), "Leak", "Water leak", IncidentType.MAINTENANCE);
    }

    private Alert newAlert(AlertSeverity severity) {
        return new Alert(incident(), new Reporter("first", "last"), "title", "details", severity);
    }

    @Test
    void newAlert_shouldStartAsCreated() {
        var alert = newAlert(AlertSeverity.LOW);
        assertEquals(AlertStatus.CREATED, alert.getStatus());
    }

    @Test
    void open_shouldSetStatusToOpen() {
        var alert = newAlert(AlertSeverity.LOW);

        alert.open();

        assertTrue(alert.isOpen());
    }

    @Test
    void resolve_shouldSetStatusToResolved() {
        var alert = newAlert(AlertSeverity.LOW);

        alert.resolve();

        assertTrue(alert.isResolved());
    }

    @Test
    void inProgress_shouldSetStatusToInProgress() {
        var alert = newAlert(AlertSeverity.LOW);

        alert.inProgress();

        assertTrue(alert.isInProgress());
    }

    @Test
    void close_shouldSetStatusToClosed() {
        var alert = newAlert(AlertSeverity.LOW);

        alert.close();

        assertTrue(alert.isClosed());
    }

    @Test
    void isCritical_shouldBeTrue_forCriticalSeverity() {
        var alert = newAlert(AlertSeverity.CRITICAL);
        assertTrue(alert.isCritical());
    }

    @Test
    void isCritical_shouldBeFalse_forNonCriticalSeverity() {
        var alert = newAlert(AlertSeverity.HIGH);
        assertFalse(alert.isCritical());
    }
}
