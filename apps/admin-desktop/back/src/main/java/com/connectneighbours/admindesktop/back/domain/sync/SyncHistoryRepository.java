package com.connectneighbours.admindesktop.back.domain.sync;

import java.util.List;
import java.util.Optional;

public interface SyncHistoryRepository {

    SyncHistoryEntry save(SyncHistoryEntry entry);

    List<SyncHistoryEntry> findByClientIdOrderByTimestampDesc(String clientId);

    Optional<SyncHistoryEntry> findLatestByClientIdAndType(String clientId, SyncType type);
}
