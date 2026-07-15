package com.connectneighbours.admindesktop.back.domain.sync;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity(name = "sync_history")
public class SyncHistoryEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String clientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SyncType type;

    @Column(nullable = false)
    private int count;

    @Column(nullable = false)
    @CreationTimestamp
    private Instant timestamp;

    public SyncHistoryEntry() {
    }

    public SyncHistoryEntry(String clientId, SyncType type, int count) {
        this.clientId = clientId;
        this.type = type;
        this.count = count;
    }

    public UUID getId() {
        return id;
    }

    public String getClientId() {
        return clientId;
    }

    public SyncType getType() {
        return type;
    }

    public int getCount() {
        return count;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
