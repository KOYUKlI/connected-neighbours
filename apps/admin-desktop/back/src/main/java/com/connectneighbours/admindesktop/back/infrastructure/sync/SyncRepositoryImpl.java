package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.application.sync.SyncHistoryDTO;
import com.connectneighbours.admindesktop.back.application.sync.SyncPushRequestDTO;
import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryEntry;
import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryRepository;
import com.connectneighbours.admindesktop.back.domain.sync.SyncRepository;
import com.connectneighbours.admindesktop.back.domain.sync.SyncType;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SyncRepositoryImpl implements SyncRepository {

    private final SyncHistoryRepository syncHistoryRepository;

    public SyncRepositoryImpl(SyncHistoryRepository syncHistoryRepository) {
        this.syncHistoryRepository = syncHistoryRepository;
    }

    @Override
    public void applyOperations(SyncPushRequestDTO request) {
    }

    @Override
    public void recordPush(String clientId, int count) {
        syncHistoryRepository.save(new SyncHistoryEntry(clientId, SyncType.PUSH, count));
    }

    @Override
    public void recordPull(String clientId, int count) {
        syncHistoryRepository.save(new SyncHistoryEntry(clientId, SyncType.PULL, count));
    }

    @Override
    public String findLastPush(String clientId) {
        return syncHistoryRepository.findLatestByClientIdAndType(clientId, SyncType.PUSH)
                .map(entry -> entry.getTimestamp().toString())
                .orElse(null);
    }

    @Override
    public String findLastPull(String clientId) {
        return syncHistoryRepository.findLatestByClientIdAndType(clientId, SyncType.PULL)
                .map(entry -> entry.getTimestamp().toString())
                .orElse(null);
    }

    @Override
    public int countPendingOperations(String clientId) {
        return 0;
    }

    @Override
    public List<SyncHistoryDTO> findHistory(String clientId) {
        return syncHistoryRepository.findByClientIdOrderByTimestampDesc(clientId).stream()
                .map(entry -> new SyncHistoryDTO(
                        entry.getTimestamp().toString(),
                        entry.getType().name(),
                        entry.getCount()
                ))
                .toList();
    }
}
