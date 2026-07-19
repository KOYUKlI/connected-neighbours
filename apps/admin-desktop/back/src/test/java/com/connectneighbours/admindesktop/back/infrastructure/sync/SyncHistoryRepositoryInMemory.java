package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryEntry;
import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryRepository;
import com.connectneighbours.admindesktop.back.domain.sync.SyncType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public class SyncHistoryRepositoryInMemory implements SyncHistoryRepository {
    private final List<SyncHistoryEntry> data = new ArrayList<>();

    @Override
    public SyncHistoryEntry save(SyncHistoryEntry entry) {
        if (entry.getTimestamp() == null) {
            entry.setTimestamp(Instant.now());
        }
        data.add(entry);
        return entry;
    }

    @Override
    public List<SyncHistoryEntry> findByClientIdOrderByTimestampDesc(String clientId) {
        return data.stream()
                .filter(e -> e.getClientId().equals(clientId))
                .sorted(Comparator.comparing(SyncHistoryEntry::getTimestamp).reversed())
                .toList();
    }

    @Override
    public Optional<SyncHistoryEntry> findLatestByClientIdAndType(String clientId, SyncType type) {
        return data.stream()
                .filter(e -> e.getClientId().equals(clientId) && e.getType() == type)
                .max(Comparator.comparing(SyncHistoryEntry::getTimestamp));
    }
}
