package com.connectneighbours.admindesktop.back.domain.operation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OperationRepository {
    Operation save(Operation operation);

    Optional<Operation> findById(UUID operationId);

    List<Operation> findAll();

    List<Operation> findByClientId(UUID clientId);

    List<Operation> findByEntityId(UUID entityId);

    List<Operation> findByOperationEntityType(OperationEntityType entityType);

    List<Operation> findByOperationType(OperationType type);

    List<Operation> findByStatus(OperationStatus status);

    void delete(Operation operation);
}
