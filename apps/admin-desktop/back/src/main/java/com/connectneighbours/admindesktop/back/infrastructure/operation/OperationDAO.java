package com.connectneighbours.admindesktop.back.infrastructure.operation;

import com.connectneighbours.admindesktop.back.domain.operation.Operation;
import com.connectneighbours.admindesktop.back.domain.operation.OperationEntityType;
import com.connectneighbours.admindesktop.back.domain.operation.OperationStatus;
import com.connectneighbours.admindesktop.back.domain.operation.OperationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OperationDAO extends JpaRepository<Operation, UUID> {
    List<Operation> findByClientId(UUID clientId);

    List<Operation> findByEntityId(UUID entityId);

    List<Operation> findByEntityType(OperationEntityType entityType);

    List<Operation> findByType(OperationType type);

    List<Operation> findByStatus(OperationStatus status);
}
