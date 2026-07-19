package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryEntry;
import com.connectneighbours.admindesktop.back.domain.sync.SyncType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SyncHistoryDAO extends JpaRepository<SyncHistoryEntry, UUID> {
    List<SyncHistoryEntry> findByClientIdOrderByTimestampDesc(String clientId);

    Optional<SyncHistoryEntry> findFirstByClientIdAndTypeOrderByTimestampDesc(String clientId, SyncType type);
}
