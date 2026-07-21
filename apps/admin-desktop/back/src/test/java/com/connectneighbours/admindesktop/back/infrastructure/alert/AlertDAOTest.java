package com.connectneighbours.admindesktop.back.infrastructure.alert;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.infrastructure.incident.IncidentDAO;
import com.connectneighbours.admindesktop.back.infrastructure.reporter.ReporterDAO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class AlertDAOTest {

    @Autowired
    private ReporterDAO reporterDAO;

    @Autowired
    private IncidentDAO incidentDAO;

    @Autowired
    private AlertDAO alertDAO;

    private Reporter reporter;
    private Incident incident;

    @BeforeEach
    void setup() {
        reporter = reporterDAO.save(new Reporter("John", "Doe"));
        incident = incidentDAO.save(new Incident(reporter, "Leak", "desc", IncidentType.MAINTENANCE, IncidentSeverity.LOW));
    }

    private Alert newAlert(AlertSeverity severity) {
        return new Alert(incident, reporter, "title", "details", severity);
    }

    @Test
    void findByIncident_shouldReturnAlertsOfGivenIncident() {
        var otherIncident = incidentDAO.save(new Incident(reporter, "Other", "desc", IncidentType.SECURITY, IncidentSeverity.LOW));
        alertDAO.save(newAlert(AlertSeverity.LOW));
        alertDAO.save(new Alert(otherIncident, reporter, "t", "d", AlertSeverity.LOW));

        var result = alertDAO.findByIncident(incident);

        assertThat(result).hasSize(1);
    }

    @Test
    void findBySeverity_shouldReturnMatchingAlerts() {
        alertDAO.save(newAlert(AlertSeverity.CRITICAL));
        alertDAO.save(newAlert(AlertSeverity.LOW));

        var result = alertDAO.findBySeverity(AlertSeverity.CRITICAL);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSeverity()).isEqualTo(AlertSeverity.CRITICAL);
    }

    @Test
    void findByStatus_shouldReturnMatchingAlerts() {
        var a1 = alertDAO.save(newAlert(AlertSeverity.LOW));
        a1.resolve();
        alertDAO.save(a1);
        alertDAO.save(newAlert(AlertSeverity.LOW));

        var result = alertDAO.findByStatus(AlertStatus.RESOLVED);

        assertThat(result).hasSize(1);
    }

    @Test
    void findByReporter_shouldReturnAlertsOfGivenReporter() {
        var otherReporter = reporterDAO.save(new Reporter("Alice", "Smith"));
        alertDAO.save(newAlert(AlertSeverity.LOW));
        alertDAO.save(new Alert(incident, otherReporter, "t", "d", AlertSeverity.LOW));

        var result = alertDAO.findByReporter(reporter);

        assertThat(result).hasSize(1);
    }

    @Test
    void findByIncidentAndSeverity_shouldReturnMatchingAlerts() {
        alertDAO.save(newAlert(AlertSeverity.CRITICAL));
        alertDAO.save(newAlert(AlertSeverity.LOW));

        var result = alertDAO.findByIncidentAndSeverity(incident, AlertSeverity.CRITICAL);

        assertThat(result).hasSize(1);
    }

    @Test
    void findByExternalIdIsNull_shouldReturnAlertsWithoutExternalId() {
        var a1 = alertDAO.save(newAlert(AlertSeverity.LOW));
        var a2 = alertDAO.save(newAlert(AlertSeverity.LOW));
        a2.setExternalId("ext-1");
        alertDAO.save(a2);

        var result = alertDAO.findByExternalIdIsNull();

        assertThat(result).extracting(Alert::getAlertId).containsExactly(a1.getAlertId());
    }

    @Test
    void findByExternalId_shouldReturnMatchingAlert() {
        var alert = newAlert(AlertSeverity.LOW);
        alert.setExternalId("ext-1");
        alertDAO.save(alert);

        var result = alertDAO.findByExternalId("ext-1");

        assertThat(result).isPresent();
    }

    @Test
    void findByExternalId_shouldReturnEmpty_whenUnknown() {
        assertThat(alertDAO.findByExternalId("unknown")).isEmpty();
    }
}
