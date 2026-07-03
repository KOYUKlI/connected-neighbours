package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.application.sync.SyncHistoryDTO;
import com.connectneighbours.admindesktop.back.application.sync.SyncPushRequestDTO;
import com.connectneighbours.admindesktop.back.domain.sync.SyncRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class SyncRepositoryImpl implements SyncRepository {

    private final Map<String, List<SyncHistoryDTO>> history = new HashMap<>();
    private final Map<String, String> lastPush = new HashMap<>();
    private final Map<String, String> lastPull = new HashMap<>();

    @Override
    public void applyOperations(SyncPushRequestDTO request) {
    }

    @Override
    public void recordPush(String clientId, int count) {
        String ts = Instant.now().toString();
        lastPush.put(clientId, ts);
        history.computeIfAbsent(clientId, k -> new ArrayList<>())
                .add(new SyncHistoryDTO(ts, "PUSH", count));
    }

    @Override
    public void recordPull(String clientId, int count) {
        String ts = Instant.now().toString();
        lastPull.put(clientId, ts);
        history.computeIfAbsent(clientId, k -> new ArrayList<>())
                .add(new SyncHistoryDTO(ts, "PULL", count));
    }

    @Override
    public String findLastPush(String clientId) {
        return lastPush.get(clientId);
    }

    @Override
    public String findLastPull(String clientId) {
        return lastPull.get(clientId);
    }

    @Override
    public int countPendingOperations(String clientId) {
        return 0;
    }

    @Override
    public List<SyncHistoryDTO> findHistory(String clientId) {
        return history.getOrDefault(clientId, List.of());
    }
}

