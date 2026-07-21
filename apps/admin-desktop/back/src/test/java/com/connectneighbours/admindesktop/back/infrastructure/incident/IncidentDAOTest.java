package com.connectneighbours.admindesktop.back.infrastructure.incident;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.infrastructure.reporter.ReporterDAO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class IncidentDAOTest {

    @Autowired
    private ReporterDAO reporterDAO;

    @Autowired
    private IncidentDAO incidentDAO;

    private Reporter reporter;

    @BeforeEach
    void setup() {
        reporter = reporterDAO.save(new Reporter("John", "Doe"));
    }

    private Incident newIncident(String title, IncidentType type, IncidentSeverity severity) {
        return new Incident(reporter, title, "desc", type, severity);
    }

    @Test
    void findByStatus_shouldReturnMatchingIncidents() {
        var i1 = incidentDAO.save(newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW));
        var i2 = incidentDAO.save(newIncident("t2", IncidentType.SECURITY, IncidentSeverity.LOW));
        i2.resolve();
        incidentDAO.save(i2);

        var result = incidentDAO.findByStatus(IncidentStatus.RESOLVED);

        assertThat(result).extracting(Incident::getIncidentId).containsExactly(i2.getIncidentId());
    }

    @Test
    void findByType_shouldReturnMatchingIncidents() {
        incidentDAO.save(newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW));
        incidentDAO.save(newIncident("t2", IncidentType.MAINTENANCE, IncidentSeverity.LOW));

        var result = incidentDAO.findByType(IncidentType.SECURITY);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("t1");
    }

    @Test
    void findByCreatedAtBetween_shouldReturnIncidentsWithinRange() {
        var now = LocalDateTime.now();
        incidentDAO.save(newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW));

        var result = incidentDAO.findByCreatedAtBetween(now.minusDays(1), now.plusDays(1));

        assertThat(result).hasSize(1);
    }

    @Test
    void findByCreatedAtBetween_shouldExcludeIncidentsOutsideRange() {
        var now = LocalDateTime.now();
        incidentDAO.save(newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW));

        var result = incidentDAO.findByCreatedAtBetween(now.minusDays(10), now.minusDays(5));

        assertThat(result).isEmpty();
    }

    @Test
    void findByReporter_shouldReturnOnlyIncidentsOfGivenReporter() {
        var otherReporter = reporterDAO.save(new Reporter("Alice", "Smith"));
        incidentDAO.save(newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW));
        incidentDAO.save(new Incident(otherReporter, "t2", "desc", IncidentType.SECURITY, IncidentSeverity.LOW));

        var result = incidentDAO.findByReporter(reporter);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("t1");
    }

    @Test
    void findByExternalIdIsNull_shouldReturnIncidentsWithoutExternalId() {
        var i1 = incidentDAO.save(newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW));
        var i2 = incidentDAO.save(newIncident("t2", IncidentType.SECURITY, IncidentSeverity.LOW));
        i2.setExternalId("ext-1");
        incidentDAO.save(i2);

        var result = incidentDAO.findByExternalIdIsNull();

        assertThat(result).extracting(Incident::getIncidentId).containsExactly(i1.getIncidentId());
    }

    @Test
    void findByExternalId_shouldReturnMatchingIncident() {
        var incident = newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW);
        incident.setExternalId("ext-1");
        incidentDAO.save(incident);

        var result = incidentDAO.findByExternalId("ext-1");

        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("t1");
    }

    @Test
    void findByExternalId_shouldReturnEmpty_whenUnknown() {
        var result = incidentDAO.findByExternalId("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void countByTypeAndCreatedAtBetween_shouldCountMatchingIncidents() {
        var now = LocalDateTime.now();
        incidentDAO.save(new Incident(reporter, "t1", "desc", IncidentType.SECURITY, IncidentSeverity.LOW, now));
        incidentDAO.save(new Incident(reporter, "t2", "desc", IncidentType.SECURITY, IncidentSeverity.LOW, now));
        incidentDAO.save(new Incident(reporter, "t3", "desc", IncidentType.MAINTENANCE, IncidentSeverity.LOW, now));

        var count = incidentDAO.countByTypeAndCreatedAtBetween(IncidentType.SECURITY, now.minusDays(1), now.plusDays(1));

        assertThat(count).isEqualTo(2L);
    }

    @Test
    void delete_shouldRemoveIncident() {
        var incident = incidentDAO.save(newIncident("t1", IncidentType.SECURITY, IncidentSeverity.LOW));

        incidentDAO.delete(incident);

        assertThat(incidentDAO.findById(incident.getIncidentId())).isEmpty();
    }
}
