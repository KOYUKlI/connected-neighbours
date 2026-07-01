package com.connectneighbours.admindesktop.back.domain.operation;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity(name = "operation")
public class Operation {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID operationId;

    @Column(nullable = false)
    private UUID clientId;

    @Column(nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationEntityType entityType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationStatus status;

    @Column(nullable = false)
    private Integer retryCount;

    @Column(nullable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime syncedAt;

    public Operation() {
    }

    public Operation(UUID clientId, UUID entityId, OperationEntityType entityType, OperationType type) {
        this.clientId = clientId;
        this.entityId = entityId;
        this.entityType = entityType;
        this.type = type;
        this.retryCount = 0;
    }

    public UUID getOperationId() {
        return operationId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public OperationEntityType getEntityType() {
        return entityType;
    }

    public OperationType getType() {
        return type;
    }

    public OperationStatus getStatus() {
        return status;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getSyncedAt() {
        return syncedAt;
    }

    public void setStatus(OperationStatus status) {
        this.status = status;
    }

    public void setSyncedAt(LocalDateTime syncedAt) {
        this.syncedAt = syncedAt;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }
}
