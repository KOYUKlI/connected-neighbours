package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class AlertMapperTest {

    @Test
    void toAlertSyncDTO_shouldMapFieldsFromAlert() {
        Reporter reporter = new Reporter("John", "Doe");
        Incident incident = new Incident(reporter, "Leak", "Water leak", IncidentType.MAINTENANCE, IncidentSeverity.HIGH);
        Alert alert = new Alert(incident, "Broken pipe", AlertSeverity.CRITICAL);
        alert.setReporter(reporter);
        alert.open();

        var dto = AlertMapper.toAlertSyncDTO(alert);

        assertEquals(alert.getAlertId(), dto.externalId());
        assertEquals(incident.getIncidentId(), dto.incidentId());
        assertEquals("Broken pipe", dto.details());
        assertEquals("critical", dto.severity());
        assertEquals("open", dto.status());
        assertEquals("desktop", dto.source());
        assertEquals(reporter.getIdReporter(), dto.reporter().idReporter());
    }

    @Test
    void fromSyncDTO_shouldMapFieldsBackToAlertDTO() {
        var reporterDTO = new ReporterDTO(UUID.randomUUID(), "Jane", "Smith", "/avatar.png");
        var createdAt = LocalDateTime.now();
        var resolvedAt = LocalDateTime.now().plusHours(1);
        var syncDTO = new AlertSyncDTO(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Broken pipe",
                "Pipe is broken",
                "critical",
                "open",
                "web",
                reporterDTO,
                createdAt,
                resolvedAt
        );

        var dto = AlertMapper.fromSyncDTO(syncDTO);

        assertEquals(syncDTO.externalId(), dto.id());
        assertEquals("Broken pipe", dto.title());
        assertEquals(reporterDTO, dto.reporter());
        assertEquals(AlertSeverity.CRITICAL, dto.severity());
        assertEquals(AlertStatus.OPEN, dto.status());
        assertEquals("Pipe is broken", dto.details());
        assertEquals(createdAt, dto.createdAt());
        assertEquals(resolvedAt, dto.resolvedAt());
    }
}
