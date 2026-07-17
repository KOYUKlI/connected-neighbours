package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentDeletionNotAllowedException;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.*;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;

class IncidentManagementTest {

    private IncidentRepository incidentRepo;
    private IncidentService incidentService;
    private IncidentManagement management;
    private final Clock clock = Clock.fixed(Instant.now(), ZoneId.systemDefault());


    @BeforeEach
    void setup() {
        incidentRepo = new IncidentRepositoryInMemory();
        incidentService = new IncidentService();
        management = new IncidentManagement(incidentRepo, incidentService);
    }

    @Test
    void startIncidentProgress_shouldSetStatusToInProgress() {
        var incident = new Incident(new Reporter("first", "last"), "Leak", "Water leak", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        var updated = management.startIncidentProgress(incident.getIncidentId());

        assertEquals(IncidentStatus.IN_PROGRESS, updated.status());
        assertEquals(IncidentStatus.IN_PROGRESS, incidentRepo.findById(incident.getIncidentId()).get().getStatus());
    }

    @Test
    void startIncidentProgress_shouldThrowIfIncidentNotFound() {
        UUID unknown = UUID.randomUUID();
        assertThrows(IncidentNotFoundException.class, () -> management.startIncidentProgress(unknown));
    }

    @Test
    void resolveIncident_shouldSetStatusToResolved() {
        var incident = new Incident(new Reporter("first", "last"), "Leak", "Water leak", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        var updated = management.resolveIncident(incident.getIncidentId());

        assertEquals(IncidentStatus.RESOLVED, updated.status());
        assertEquals(IncidentStatus.RESOLVED, incidentRepo.findById(incident.getIncidentId()).get().getStatus());
    }

    @Test
    void resolveIncident_shouldThrowIfIncidentNotFound() {
        UUID unknown = UUID.randomUUID();
        assertThrows(IncidentNotFoundException.class, () -> management.resolveIncident(unknown));
    }


    @Test
    void createIncident_shouldCreateAndReturnDTO() {
        var dto = new CreationIncidentDTO(new Reporter("first", "last"), "Fire", "Kitchen fire", IncidentType.MAINTENANCE, IncidentSeverity.LOW);

        var result = management.createIncident(dto);

        assertEquals("Fire", result.title());
        assertEquals(IncidentStatus.CREATED, result.status());
        assertEquals(1, incidentRepo.findAll().size());
    }

    @Test
    void createIncident_shouldThrow_whenTitleIsNull() {
        var dto = new CreationIncidentDTO(
                new Reporter("first", "last"),
                null,
                "desc",
                IncidentType.MAINTENANCE,
                IncidentSeverity.LOW
        );

        assertThrows(IllegalArgumentException.class, () -> management.createIncident(dto));
    }


    @Test
    void createIncident_shouldThrow_whenTitleIsBlank() {
        var dto = new CreationIncidentDTO(
                new Reporter("first", "last"),
                "",
                "desc",
                IncidentType.MAINTENANCE,
                IncidentSeverity.LOW
        );

        assertThrows(IllegalArgumentException.class, () -> management.createIncident(dto));
    }


    @Test
    void createIncident_shouldThrow_whenDescriptionIsNull() {
        var dto = new CreationIncidentDTO(
                new Reporter("first", "last"),
                "Leak",
                null,
                IncidentType.MAINTENANCE,
                IncidentSeverity.LOW
        );

        assertThrows(IllegalArgumentException.class, () -> management.createIncident(dto));
    }


    @Test
    void createIncident_shouldThrow_whenReporterIsNull() {
        var dto = new CreationIncidentDTO(
                null,
                "Leak",
                "desc",
                IncidentType.MAINTENANCE,
                IncidentSeverity.LOW
        );

        assertThrows(IllegalArgumentException.class, () -> management.createIncident(dto));
    }


    @Test
    void updateIncident_shouldModifyFields() {
        var incident = new Incident(new Reporter("first", "last"), "Old", "Desc", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        var updated = management.updateIncident(
                incident.getIncidentId(),
                new UpdateIncidentDTO("NewTitle", "NewDesc", IncidentType.MAINTENANCE)
        );

        assertEquals("NewTitle", updated.title());
        assertEquals("NewDesc", updated.description());
        assertEquals(IncidentType.MAINTENANCE, updated.type());
    }

    @Test
    void updateIncident_shouldThrow_whenTitleIsNull() {
        var incident = new Incident(new Reporter("first", "last"), "Old", "Desc", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        var dto = new UpdateIncidentDTO(null, "NewDesc", IncidentType.MAINTENANCE);

        assertThrows(IllegalArgumentException.class, () -> management.updateIncident(incident.getIncidentId(), dto));
    }


    @Test
    void updateIncident_shouldThrow_whenDescriptionIsBlank() {
        var incident = new Incident(new Reporter("first", "last"), "Old", "Desc", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        var dto = new UpdateIncidentDTO("New", "", IncidentType.MAINTENANCE);

        assertThrows(IllegalArgumentException.class, () -> management.updateIncident(incident.getIncidentId(), dto));
    }

    @Test
    void updateIncident_shouldThrow_whenIdIsNull() {
        var dto = new UpdateIncidentDTO("NewTitle", "NewDesc", IncidentType.MAINTENANCE);

        assertThrows(IllegalArgumentException.class, () -> management.updateIncident(null, dto));
    }


    @Test
    void listIncidents_shouldReturnPaginatedResults() {
        for (int i = 0; i < 15; i++) {
            incidentRepo.save(new Incident(new Reporter("first", "last"), "i" + i, "desc", IncidentType.MAINTENANCE));
        }

        var page0 = management.listIncidents(0, 10);
        var page1 = management.listIncidents(1, 10);

        assertEquals(10, page0.size());
        assertEquals(5, page1.size());
    }

    @Test
    void listByStatus_shouldReturnMatchingIncidents() {
        var i1 = new Incident(new Reporter("first", "last"), "t1", "d1", IncidentType.MAINTENANCE);
        i1.resolve();
        incidentRepo.save(i1);

        var i2 = new Incident(new Reporter("first", "last"), "t2", "d2", IncidentType.MAINTENANCE);
        incidentRepo.save(i2);

        var result = management.listByStatus(IncidentStatus.RESOLVED);
        var i1Dto = IncidentMapper.toDTO(i1);

        assertThat(result).containsExactly(i1Dto);
    }

    @Test
    void listByType_shouldReturnMatchingIncidents() {
        var i1 = new Incident(new Reporter("first", "last"), "t1", "d1", IncidentType.MAINTENANCE);
        var i2 = new Incident(new Reporter("first", "last"), "t2", "d2", IncidentType.MAINTENANCE);
        incidentRepo.save(i1);
        incidentRepo.save(i2);

        var result = management.listByType(IncidentType.MAINTENANCE);

        var i1Dto = IncidentMapper.toDTO(i1);
        var i2Dto = IncidentMapper.toDTO(i2);

        assertThat(result).containsExactly(i1Dto, i2Dto);
    }


    @Test
    void getIncident_shouldReturnCorrectIncident() {
        var incident = new Incident(new Reporter("first", "last"), "Fire", "Kitchen", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        var result = management.getIncident(incident.getIncidentId());

        assertEquals("Fire", result.title());
        assertEquals("Kitchen", result.description());
    }

    @Test
    void listByDateRange_shouldReturnMatchingIncidents() {
        var now = LocalDateTime.now(clock);

        var i1 = new Incident(new Reporter("first", "last"), "t1", "d1", IncidentType.MAINTENANCE, clock);
        incidentRepo.save(i1);

        var i2 = new Incident(new Reporter("first", "last"), "t2", "d2", IncidentType.MAINTENANCE, clock);
        incidentRepo.save(i2);

        var result = management.listByDateRange(
                now.minusDays(1),
                now.plusSeconds(1)
        );

        var i1Dto = IncidentMapper.toDTO(i1);
        var i2Dto = IncidentMapper.toDTO(i2);

        assertThat(result).containsExactly(i1Dto, i2Dto);
    }


    @Test
    void deleteIncident_shouldDelete_whenStatusIsResolved() {
        var incident = new Incident(new Reporter("first", "last"), "t", "d", IncidentType.MAINTENANCE);
        incident.resolve();
        incidentRepo.save(incident);

        management.deleteIncident(incident.getIncidentId());

        assertThat(incidentRepo.findById(incident.getIncidentId())).isEmpty();
    }

    @Test
    void deleteIncident_shouldDelete_whenStatusIsClosed() {
        var incident = new Incident(new Reporter("first", "last"), "t", "d", IncidentType.MAINTENANCE);
        incident.close();
        incidentRepo.save(incident);

        management.deleteIncident(incident.getIncidentId());

        assertThat(incidentRepo.findById(incident.getIncidentId())).isEmpty();
    }

    @Test
    void deleteIncident_shouldThrow_whenStatusIsOpen() {
        var incident = new Incident(new Reporter("first", "last"), "t", "d", IncidentType.MAINTENANCE);
        incidentRepo.save(incident);

        assertThatThrownBy(() -> management.deleteIncident(incident.getIncidentId()))
                .isInstanceOf(IncidentDeletionNotAllowedException.class)
                .hasMessageContaining("must be resolved or closed");
    }

    @Test
    void deleteIncident_shouldThrow_whenIdIsNull() {
        assertThrows(IllegalArgumentException.class, () -> management.deleteIncident(null));
    }


    @Test
    void findByReporter_returnsEmptyList_whenNoIncidents() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var result = incidentRepo.findByReporter(reporter1);
        assertTrue(result.isEmpty());
    }

    @Test
    void findByReporter_returnsOnlyIncidentsOfGivenReporter() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var reporter2 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "Alice",
                "Smith"
        );

        var i1 = new Incident(reporter1, "t1", "d1", IncidentType.SECURITY, clock);
        var i2 = new Incident(reporter1, "t2", "d2", IncidentType.MAINTENANCE, clock);
        var i3 = new Incident(reporter2, "t3", "d3", IncidentType.SECURITY, clock);

        incidentRepo.save(i1);
        incidentRepo.save(i2);
        incidentRepo.save(i3);

        var result = incidentRepo.findByReporter(reporter1);

        assertEquals(2, result.size());
        assertTrue(result.contains(i1));
        assertTrue(result.contains(i2));
        assertFalse(result.contains(i3));
    }

    @Test
    void findByReporter_returnsEmptyList_whenReporterHasNoIncidents() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var reporter2 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "Alice",
                "Smith"
        );

        var i1 = new Incident(reporter1, "t1", "d1", IncidentType.SECURITY, clock);
        incidentRepo.save(i1);

        var result = incidentRepo.findByReporter(reporter2);

        assertTrue(result.isEmpty());
    }

    @Test
    void findByReporter_doesNotReturnIncidentsOfOtherReporter() {
        var reporter1 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "John",
                "Doe"
        );

        var reporter2 = new Reporter(
                LocalDateTime.now(),
                LocalDateTime.now(),
                "Alice",
                "Smith"
        );

        var i1 = new Incident(reporter1, "t1", "d1", IncidentType.SECURITY, clock);
        var i2 = new Incident(reporter2, "t2", "d2", IncidentType.MAINTENANCE, clock);

        incidentRepo.save(i1);
        incidentRepo.save(i2);

        var result = incidentRepo.findByReporter(reporter1);

        assertEquals(1, result.size());
        assertTrue(result.contains(i1));
        assertFalse(result.contains(i2));
    }


}
