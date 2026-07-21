package com.connectneighbours.admindesktop.back.domain.alert;

import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertAlreadyClosedException;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertAlreadyInProgressException;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertAlreadyOpenException;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertAlreadyResolvedException;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AlertServiceTest {

    private AlertService service;

    @BeforeEach
    void setup() {
        service = new AlertService();
    }

    private Alert newAlert(AlertSeverity severity) {
        var incident = new Incident(new Reporter("first", "last"), "Leak", "Water leak", IncidentType.MAINTENANCE);
        return new Alert(incident, new Reporter("first", "last"), "title", "details", severity);
    }

    @Test
    void open_shouldThrow_whenAlreadyOpen() {
        var alert = newAlert(AlertSeverity.LOW);
        alert.open();

        assertThrows(AlertAlreadyOpenException.class, () -> service.open(alert));
    }

    @Test
    void open_shouldSucceed_whenCreated() {
        var alert = newAlert(AlertSeverity.LOW);

        service.open(alert);

        assertTrue(alert.isOpen());
    }

    @Test
    void resolve_shouldThrow_whenAlreadyResolved() {
        var alert = newAlert(AlertSeverity.LOW);
        alert.resolve();

        assertThrows(AlertAlreadyResolvedException.class, () -> service.resolve(alert));
    }

    @Test
    void resolve_shouldSucceed_whenNotResolved() {
        var alert = newAlert(AlertSeverity.LOW);

        service.resolve(alert);

        assertTrue(alert.isResolved());
    }

    @Test
    void inProgress_shouldThrow_whenAlreadyInProgress() {
        var alert = newAlert(AlertSeverity.LOW);
        alert.inProgress();

        assertThrows(AlertAlreadyInProgressException.class, () -> service.inProgress(alert));
    }

    @Test
    void inProgress_shouldSucceed_whenCreated() {
        var alert = newAlert(AlertSeverity.LOW);

        service.inProgress(alert);

        assertTrue(alert.isInProgress());
    }

    @Test
    void close_shouldThrow_whenAlreadyClosed() {
        var alert = newAlert(AlertSeverity.LOW);
        alert.close();

        assertThrows(AlertAlreadyClosedException.class, () -> service.close(alert));
    }

    @Test
    void close_shouldSucceed_whenNotClosed() {
        var alert = newAlert(AlertSeverity.LOW);

        service.close(alert);

        assertTrue(alert.isClosed());
    }

    @Test
    void canBeResolved_shouldBeFalse_whenAlreadyResolved() {
        var alert = newAlert(AlertSeverity.LOW);
        alert.resolve();

        assertFalse(service.canBeResolved(alert));
    }

    @Test
    void canBeResolved_shouldBeTrue_whenNotResolved() {
        var alert = newAlert(AlertSeverity.LOW);

        assertTrue(service.canBeResolved(alert));
    }
}
