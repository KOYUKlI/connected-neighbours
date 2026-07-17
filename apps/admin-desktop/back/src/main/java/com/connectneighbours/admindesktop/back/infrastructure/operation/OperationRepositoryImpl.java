package com.connectneighbours.admindesktop.back.infrastructure.operation;

import com.connectneighbours.admindesktop.back.domain.operation.*;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class OperationRepositoryImpl implements OperationRepository {
    private final OperationDAO dao;

    public OperationRepositoryImpl(OperationDAO operationDAO) {
        this.dao = operationDAO;
    }

    @Override
    public Operation save(Operation operation) {
        return dao.save(operation);
    }

    @Override
    public Optional<Operation> findById(UUID operationId) {
        return dao.findById(operationId);
    }

    @Override
    public List<Operation> findAll() {
        return dao.findAll();
    }

    @Override
    public List<Operation> findByClientId(UUID clientId) {
        return dao.findByClientId(clientId);
    }

    @Override
    public List<Operation> findByEntityId(UUID entityId) {
        return dao.findByEntityId(entityId);
    }

    @Override
    public List<Operation> findByOperationEntityType(OperationEntityType entityType) {
        return dao.findByEntityType(entityType);
    }

    @Override
    public List<Operation> findByOperationType(OperationType type) {
        return dao.findByType(type);
    }

    @Override
    public List<Operation> findByStatus(OperationStatus status) {
        return dao.findByStatus(status);
    }

    @Override
    public void delete(Operation operation) {
        dao.delete(operation);
    }
}
