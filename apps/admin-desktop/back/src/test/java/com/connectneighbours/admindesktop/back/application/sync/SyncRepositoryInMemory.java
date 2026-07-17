package com.connectneighbours.admindesktop.back.application.sync;

import com.connectneighbours.admindesktop.back.domain.sync.SyncRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SyncRepositoryInMemory implements SyncRepository {
    private final Map<String, List<SyncHistoryDTO>> history = new HashMap<>();
    private final Map<String, String> lastPush = new HashMap<>();
    private final Map<String, String> lastPull = new HashMap<>();
    private boolean applyOperationsCalled = false;

    @Override
    public void applyOperations(SyncPushRequestDTO request) {
        applyOperationsCalled = true;
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

    public boolean wasApplyOperationsCalled() {
        return applyOperationsCalled;
    }
}
