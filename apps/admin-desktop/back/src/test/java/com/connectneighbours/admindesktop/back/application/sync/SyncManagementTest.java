package com.connectneighbours.admindesktop.back.application.sync;

import com.connectneighbours.admindesktop.back.application.incident.IncidentRepositoryInMemory;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertRepositoryInMemory;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterRepositoryInMemory;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import com.connectneighbours.admindesktop.back.infrastructure.auth.SessionContext;
import com.connectneighbours.admindesktop.back.infrastructure.sync.SyncHttpClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class SyncManagementTest {
    private SyncRepositoryInMemory syncRepo;
    private IncidentRepository incidentRepo;
    private AlertRepository alertRepo;
    private ReporterRepository reporterRepo;
    private SyncManagement management;

    private static final String CLIENT_ID = "desktop-1";

    @BeforeEach
    void setup() {
        syncRepo = new SyncRepositoryInMemory();
        incidentRepo = new IncidentRepositoryInMemory();
        alertRepo = new AlertRepositoryInMemory();
        reporterRepo = new ReporterRepositoryInMemory();
        SyncHttpClient syncHttpClient = new SyncHttpClient(
                new RestTemplateBuilder(), new SessionContext(), "http://localhost:3000/api");
        management = new SyncManagement(syncRepo, incidentRepo, alertRepo, reporterRepo, syncHttpClient);
    }

    @Test
    void push_shouldRecordAHistoryEntry() {
        var request = new SyncPushRequestDTO(CLIENT_ID, List.of(
                new SyncOperationPayloadDTO(java.util.UUID.randomUUID(), "INCIDENT", "CREATE", null)
        ));

        management.push(request);

        var history = management.history(CLIENT_ID);
        assertEquals(1, history.size());
        assertEquals("PUSH", history.get(0).type());
        assertEquals(1, history.get(0).count());
    }

    @Test
    void push_shouldRecordZeroCount_whenOperationsListIsEmpty() {
        var request = new SyncPushRequestDTO(CLIENT_ID, List.of());

        management.push(request);

        var history = management.history(CLIENT_ID);
        assertEquals(1, history.size());
        assertEquals(0, history.get(0).count());
    }

    @Test
    void pull_shouldReturnEmptyResponse_whenNoUpdatedEntities() {
        var response = management.pull(CLIENT_ID, null);

        assertTrue(response.incidents().isEmpty());
        assertTrue(response.alerts().isEmpty());
    }

    @Test
    void pull_shouldNotThrow_whenSinceIsNull() {
        assertDoesNotThrow(() -> management.pull(CLIENT_ID, null));
    }

    @Test
    void pull_shouldRecordAHistoryEntry() {
        management.pull(CLIENT_ID, null);

        var history = management.history(CLIENT_ID);
        assertEquals(1, history.size());
        assertEquals("PULL", history.get(0).type());
    }

    @Test
    void status_shouldReflectLastPushAndLastPull() {
        management.push(new SyncPushRequestDTO(CLIENT_ID, List.of()));
        management.pull(CLIENT_ID, null);

        var status = management.status(CLIENT_ID);

        assertNotNull(status.lastPush());
        assertNotNull(status.lastPull());
        assertEquals(CLIENT_ID, status.clientId());
    }

    @Test
    void status_shouldBeOK_whenNoPendingOperations() {
        var status = management.status(CLIENT_ID);

        assertEquals(0, status.pendingOperations());
        assertEquals("OK", status.status());
    }

    @Test
    void status_shouldHaveNullTimestamps_whenNoActivityYet() {
        var status = management.status(CLIENT_ID);

        assertNull(status.lastPush());
        assertNull(status.lastPull());
    }

    @Test
    void history_shouldReturnEmptyList_forUnknownClient() {
        assertTrue(management.history("unknown-client").isEmpty());
    }

    @Test
    void history_shouldAccumulateMultipleEntries() {
        management.push(new SyncPushRequestDTO(CLIENT_ID, List.of()));
        management.pull(CLIENT_ID, null);
        management.push(new SyncPushRequestDTO(CLIENT_ID, List.of()));

        assertEquals(3, management.history(CLIENT_ID).size());
    }

    @Test
    void noArgHistoryAndStatus_shouldUseInternalDefaultClientId() {
        management.push(new SyncPushRequestDTO(CLIENT_ID, List.of()));

        assertEquals(1, management.history().size());
        assertEquals(CLIENT_ID, management.status().clientId());
    }
}
