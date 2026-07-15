package com.connectneighbours.admindesktop.back.domain.operation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class OperationServiceTest {
    private OperationRepositoryInMemory repository;
    private OperationService service;

    @BeforeEach
    void setup() {
        repository = new OperationRepositoryInMemory();
        service = new OperationService(repository);
    }

    @Test
    void addCreate_shouldPersistAPendingCreateOperation() {
        UUID entityId = UUID.randomUUID();

        service.addCreate(entityId, OperationEntityType.INCIDENT);

        var pending = service.getPending();
        assertEquals(1, pending.size());
        assertEquals(entityId, pending.get(0).getEntityId());
        assertEquals(OperationEntityType.INCIDENT, pending.get(0).getEntityType());
        assertEquals(OperationType.CREATE, pending.get(0).getType());
        assertEquals(OperationStatus.PENDING, pending.get(0).getStatus());
    }

    @Test
    void addUpdate_shouldPersistAPendingUpdateOperation() {
        UUID entityId = UUID.randomUUID();

        service.addUpdate(entityId, OperationEntityType.ALERT);

        var pending = service.getPending();
        assertEquals(1, pending.size());
        assertEquals(OperationType.UPDATE, pending.get(0).getType());
    }

    @Test
    void addDelete_shouldPersistAPendingDeleteOperation() {
        UUID entityId = UUID.randomUUID();

        service.addDelete(entityId, OperationEntityType.INCIDENT);

        var pending = service.getPending();
        assertEquals(1, pending.size());
        assertEquals(OperationType.DELETE, pending.get(0).getType());
    }

    @Test
    void addCreate_shouldInitializeRetryCountToZero() {
        service.addCreate(UUID.randomUUID(), OperationEntityType.INCIDENT);

        assertEquals(0, service.getPending().get(0).getRetryCount());
    }

    @Test
    void getPending_shouldOnlyReturnPendingOperations() {
        service.addCreate(UUID.randomUUID(), OperationEntityType.INCIDENT);
        service.addCreate(UUID.randomUUID(), OperationEntityType.ALERT);

        var toSync = repository.findByOperationEntityType(OperationEntityType.ALERT).get(0);
        service.markSynced(toSync);

        var pending = service.getPending();
        assertEquals(1, pending.size());
        assertEquals(OperationEntityType.INCIDENT, pending.get(0).getEntityType());
    }

    @Test
    void markSynced_shouldSetStatusAndSyncedAt() {
        service.addCreate(UUID.randomUUID(), OperationEntityType.INCIDENT);
        var op = repository.findAll().get(0);

        service.markSynced(op);

        assertEquals(OperationStatus.SYNCED, op.getStatus());
        assertNotNull(op.getSyncedAt());
    }

    @Test
    void incrementRetry_shouldIncreaseRetryCountByOne() {
        service.addCreate(UUID.randomUUID(), OperationEntityType.INCIDENT);
        var op = repository.findAll().get(0);

        service.incrementRetry(op);
        service.incrementRetry(op);

        assertEquals(2, op.getRetryCount());
    }
}
