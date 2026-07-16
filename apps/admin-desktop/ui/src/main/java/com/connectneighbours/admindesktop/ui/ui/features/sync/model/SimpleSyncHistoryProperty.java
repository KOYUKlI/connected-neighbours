package com.connectneighbours.admindesktop.ui.ui.features.sync.model;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class SimpleSyncHistoryProperty implements SyncHistoryProperty {
    private final StringProperty timestamp = new SimpleStringProperty();
    private final StringProperty type = new SimpleStringProperty();
    private final IntegerProperty count = new SimpleIntegerProperty();

    @Override
    public StringProperty timestampProperty() {
        return timestamp;
    }

    @Override
    public StringProperty typeProperty() {
        return type;
    }

    @Override
    public IntegerProperty countProperty() {
        return count;
    }
}
