package com.connectneighbours.admindesktop.back.domain.sync;

import com.connectneighbours.admindesktop.back.application.sync.SyncHistoryDTO;
import com.connectneighbours.admindesktop.back.application.sync.SyncPushRequestDTO;

import java.util.List;

public interface SyncRepository {

    void applyOperations(SyncPushRequestDTO request);

    void recordPush(String clientId, int count);

    void recordPull(String clientId, int count);

    String findLastPush(String clientId);

    String findLastPull(String clientId);

    int countPendingOperations(String clientId);

    List<SyncHistoryDTO> findHistory(String clientId);
}

