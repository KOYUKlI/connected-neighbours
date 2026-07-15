package com.connectneighbours.admindesktop.back.application.incident;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class IncidentMapperTest {

    private Incident createIncident() {
        Reporter reporter = new Reporter("John", "Doe");
        return new Incident(reporter, "Leak", "Water leak", IncidentType.MAINTENANCE, IncidentSeverity.HIGH);
    }

    @Test
    void toIncidentSyncDTO_shouldMapBasicFields() {
        Incident incident = createIncident();

        var dto = IncidentMapper.toIncidentSyncDTO(incident);

        assertEquals(incident.getIncidentId(), dto.externalId());
        assertEquals("Leak", dto.title());
        assertEquals("Water leak", dto.description());
        assertEquals("maintenance", dto.type());
        assertEquals("high", dto.severity());
        assertEquals("desktop", dto.source());
        assertTrue(dto.alerts().isEmpty());
    }

    @Test
    void toIncidentSyncDTO_shouldMapStatusField_toStatusNotType() {
        Incident incident = createIncident();
        incident.resolve();

        var dto = IncidentMapper.toIncidentSyncDTO(incident);

        assertEquals("resolved", dto.status());
        assertEquals("maintenance", dto.type());
        assertEquals(incident.getResolvedAt(), dto.resolvedAt());
    }

    @Test
    void toIncidentSyncDTO_shouldMapNestedAlerts() {
        Incident incident = createIncident();
        Alert alert = new Alert(incident, "Broken pipe", AlertSeverity.CRITICAL);
        incident.getAlerts().add(alert);

        var dto = IncidentMapper.toIncidentSyncDTO(incident);

        assertEquals(1, dto.alerts().size());
        assertEquals("Broken pipe", dto.alerts().get(0).details());
    }

    @Test
    void toIncidentSyncDTO_shouldAssignANonNullNeighborhoodId() {
        Incident incident = createIncident();

        var dto = IncidentMapper.toIncidentSyncDTO(incident);

        assertNotNull(dto.neighborhoodId());
    }
}
