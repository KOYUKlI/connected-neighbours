package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryEntry;
import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryRepository;
import com.connectneighbours.admindesktop.back.domain.sync.SyncType;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class SyncHistoryRepositoryImpl implements SyncHistoryRepository {
    private final SyncHistoryDAO dao;

    public SyncHistoryRepositoryImpl(SyncHistoryDAO dao) {
        this.dao = dao;
    }

    @Override
    public SyncHistoryEntry save(SyncHistoryEntry entry) {
        return dao.save(entry);
    }

    @Override
    public List<SyncHistoryEntry> findByClientIdOrderByTimestampDesc(String clientId) {
        return dao.findByClientIdOrderByTimestampDesc(clientId);
    }

    @Override
    public Optional<SyncHistoryEntry> findLatestByClientIdAndType(String clientId, SyncType type) {
        return dao.findFirstByClientIdAndTypeOrderByTimestampDesc(clientId, type);
    }
}
