package com.connectneighbours.admindesktop.ui.ui.features.sync.model;

import javafx.beans.property.ReadOnlyIntegerProperty;
import javafx.beans.property.ReadOnlyStringProperty;

public interface ReadOnlySyncHistoryProperty {
    ReadOnlyStringProperty timestampProperty();

    ReadOnlyStringProperty typeProperty();

    ReadOnlyIntegerProperty countProperty();
}
