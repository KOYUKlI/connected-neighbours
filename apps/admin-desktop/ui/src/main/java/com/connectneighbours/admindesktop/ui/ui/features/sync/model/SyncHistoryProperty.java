package com.connectneighbours.admindesktop.ui.ui.features.sync.model;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.StringProperty;

public interface SyncHistoryProperty extends ReadOnlySyncHistoryProperty {
    StringProperty timestampProperty();

    StringProperty typeProperty();

    IntegerProperty countProperty();
}
