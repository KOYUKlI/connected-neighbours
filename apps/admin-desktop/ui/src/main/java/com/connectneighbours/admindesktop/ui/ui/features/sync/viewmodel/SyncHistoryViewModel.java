package com.connectneighbours.admindesktop.ui.ui.features.sync.viewmodel;

import com.connectneighbours.admindesktop.back.application.sync.SyncHistoryDTO;
import com.connectneighbours.admindesktop.ui.ui.features.sync.model.ReadOnlySyncHistoryProperty;
import com.connectneighbours.admindesktop.ui.ui.features.sync.model.SimpleSyncHistoryProperty;

public class SyncHistoryViewModel {
    private final SimpleSyncHistoryProperty syncHistory = new SimpleSyncHistoryProperty();

    private SyncHistoryDTO dto;

    public SyncHistoryDTO getDto() {
        return dto;
    }

    public void setDto(SyncHistoryDTO dto) {
        this.dto = dto;
    }

    public ReadOnlySyncHistoryProperty syncHistoryProperty() {
        return syncHistory;
    }

    public void setSyncHistory(ReadOnlySyncHistoryProperty source) {
        if (source == null) {
            syncHistory.timestampProperty().set("");
            syncHistory.typeProperty().set("");
            syncHistory.countProperty().set(0);
            return;
        }

        syncHistory.timestampProperty().set(source.timestampProperty().get());
        syncHistory.typeProperty().set(source.typeProperty().get());
        syncHistory.countProperty().set(source.countProperty().get());
    }
}
