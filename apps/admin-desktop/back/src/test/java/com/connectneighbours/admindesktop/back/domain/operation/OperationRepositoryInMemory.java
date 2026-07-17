package com.connectneighbours.admindesktop.back.domain.operation;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public class OperationRepositoryInMemory implements OperationRepository {
    private final Map<UUID, Operation> data = new LinkedHashMap<>();

    @Override
    public Operation save(Operation operation) {
        if (operation.getOperationId() == null) {
            operation.setOperationId(UUID.randomUUID());
        }
        data.put(operation.getOperationId(), operation);
        return operation;
    }

    @Override
    public Optional<Operation> findById(UUID operationId) {
        return Optional.ofNullable(data.get(operationId));
    }

    @Override
    public List<Operation> findAll() {
        return new ArrayList<>(data.values());
    }

    @Override
    public List<Operation> findByClientId(UUID clientId) {
        return data.values().stream()
                .filter(o -> o.getClientId().equals(clientId))
                .toList();
    }

    @Override
    public List<Operation> findByEntityId(UUID entityId) {
        return data.values().stream()
                .filter(o -> o.getEntityId().equals(entityId))
                .toList();
    }

    @Override
    public List<Operation> findByOperationEntityType(OperationEntityType entityType) {
        return data.values().stream()
                .filter(o -> o.getEntityType() == entityType)
                .toList();
    }

    @Override
    public List<Operation> findByOperationType(OperationType type) {
        return data.values().stream()
                .filter(o -> o.getType() == type)
                .toList();
    }

    @Override
    public List<Operation> findByStatus(OperationStatus status) {
        return data.values().stream()
                .filter(o -> o.getStatus() == status)
                .toList();
    }

    @Override
    public void delete(Operation operation) {
        data.remove(operation.getOperationId());
    }
}
