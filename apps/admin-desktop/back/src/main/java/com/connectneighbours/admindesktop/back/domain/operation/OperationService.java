package com.connectneighbours.admindesktop.back.domain.operation;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OperationService {
    private final OperationRepository repository;
    private final UUID clientId = UUID.randomUUID();


    public OperationService(OperationRepository repository) {
        this.repository = repository;
    }

    public void addCreate(UUID entityId, OperationEntityType type) {
        repository.save(new Operation(clientId, entityId, type, OperationType.CREATE));
    }

    public void addUpdate(UUID entityId, OperationEntityType type) {
        repository.save(new Operation(clientId, entityId, type, OperationType.UPDATE));
    }

    public void addDelete(UUID entityId, OperationEntityType type) {
        repository.save(new Operation(clientId, entityId, type, OperationType.DELETE));
    }

    public List<Operation> getPending() {
        return repository.findByStatus(OperationStatus.PENDING);
    }

    public void markSynced(Operation op) {
        op.setStatus(OperationStatus.SYNCED);
        op.setSyncedAt(LocalDateTime.now());
        repository.save(op);
    }

    public void incrementRetry(Operation op) {
        op.setRetryCount(op.getRetryCount() + 1);
        repository.save(op);
    }
}
