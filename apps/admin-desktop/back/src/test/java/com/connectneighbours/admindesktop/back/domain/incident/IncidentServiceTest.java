package com.connectneighbours.admindesktop.back.domain.incident;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertAlreadyResolvedException;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertNotResolvedException;
import com.connectneighbours.admindesktop.back.domain.exception.incident.*;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class IncidentServiceTest {

    private IncidentService service;

    @BeforeEach
    void setup() {
        service = new IncidentService();
    }

    private Incident newIncident() {
        return new Incident(new Reporter("first", "last"), "Leak", "Water leak", IncidentType.MAINTENANCE);
    }

    private Alert alertWith(Incident incident, AlertSeverity severity) {
        return new Alert(incident, new Reporter("first", "last"), "title", "details", severity);
    }

    @Test
    void open_shouldThrow_whenAlreadyOpen() {
        var incident = newIncident();
        incident.open();

        assertThrows(IncidentAlreadyOpenException.class, () -> service.open(incident));
    }

    @Test
    void open_shouldThrow_whenAlreadyResolved() {
        var incident = newIncident();
        incident.resolve();

        assertThrows(IncidentAlreadyResolvedException.class, () -> service.open(incident));
    }

    @Test
    void open_shouldSucceed_whenCreated() {
        var incident = newIncident();

        service.open(incident);

        assertTrue(incident.isOpen());
    }

    @Test
    void resolve_shouldThrow_whenAlreadyResolved() {
        var incident = newIncident();
        incident.resolve();

        assertThrows(IncidentAlreadyResolvedException.class, () -> service.resolve(incident));
    }

    @Test
    void resolve_shouldThrow_whenIncidentHasCriticalOpenAlert() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.CRITICAL);
        alert.open();
        incident.getAlerts().add(alert);

        assertThrows(IncidentHasCriticalAlertsException.class, () -> service.resolve(incident));
    }

    @Test
    void resolve_shouldSucceed_whenOnlyNonCriticalAlertIsInProgress() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.LOW);
        alert.inProgress();
        incident.getAlerts().add(alert);

        service.resolve(incident);

        assertTrue(incident.isResolved());
    }

    @Test
    void startProgress_shouldThrow_whenAlreadyInProgress() {
        var incident = newIncident();
        incident.inProgress();

        assertThrows(IncidentAlreadyInProgressException.class, () -> service.startProgress(incident));
    }

    @Test
    void startProgress_shouldSucceed_whenCreated() {
        var incident = newIncident();

        service.startProgress(incident);

        assertTrue(incident.isInProgress());
    }

    @Test
    void close_shouldThrow_whenAlreadyClosed() {
        var incident = newIncident();
        incident.close();

        assertThrows(IncidentAlreadyClosedException.class, () -> service.close(incident));
    }

    @Test
    void close_shouldSucceed_whenNotClosed() {
        var incident = newIncident();

        service.close(incident);

        assertTrue(incident.isClosed());
    }

    @Test
    void attachAlert_shouldThrow_whenIncidentAlreadyResolved() {
        var incident = newIncident();
        incident.resolve();
        var alert = alertWith(incident, AlertSeverity.LOW);

        assertThrows(IncidentAlreadyResolvedException.class, () -> service.attachAlert(incident, alert));
    }

    @Test
    void attachAlert_shouldThrow_whenAlertAlreadyResolved() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.LOW);
        alert.resolve();

        assertThrows(AlertAlreadyResolvedException.class, () -> service.attachAlert(incident, alert));
    }

    @Test
    void attachAlert_shouldAddAlert_whenValid() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.LOW);

        service.attachAlert(incident, alert);

        assertTrue(incident.getAlerts().contains(alert));
    }

    @Test
    void detachAlert_shouldThrow_whenAlertNotResolved() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.LOW);
        incident.getAlerts().add(alert);

        assertThrows(AlertNotResolvedException.class, () -> service.detachAlert(incident, alert));
    }

    @Test
    void detachAlert_shouldRemoveAlert_whenResolved() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.LOW);
        alert.resolve();
        incident.getAlerts().add(alert);

        service.detachAlert(incident, alert);

        assertFalse(incident.getAlerts().contains(alert));
    }

    @Test
    void canBeResolved_shouldBeFalse_whenAlreadyResolved() {
        var incident = newIncident();
        incident.resolve();

        assertFalse(service.canBeResolved(incident));
    }

    @Test
    void canBeResolved_shouldBeFalse_whenHasCriticalOpenAlert() {
        var incident = newIncident();
        var alert = alertWith(incident, AlertSeverity.CRITICAL);
        alert.open();
        incident.getAlerts().add(alert);

        assertFalse(service.canBeResolved(incident));
    }

    @Test
    void canBeResolved_shouldBeTrue_whenNoBlockingConditions() {
        var incident = newIncident();

        assertTrue(service.canBeResolved(incident));
    }

    @Test
    void ensureCanBeDeleted_shouldThrow_whenIncidentIsOpen() {
        var incident = newIncident();
        incident.open();

        assertThrows(IncidentDeletionNotAllowedException.class, () -> service.ensureCanBeDeleted(incident));
    }

    @Test
    void ensureCanBeDeleted_shouldNotThrow_whenResolved() {
        var incident = newIncident();
        incident.resolve();

        assertDoesNotThrow(() -> service.ensureCanBeDeleted(incident));
    }

    @Test
    void ensureCanBeDeleted_shouldNotThrow_whenClosed() {
        var incident = newIncident();
        incident.close();

        assertDoesNotThrow(() -> service.ensureCanBeDeleted(incident));
    }
}
