package com.connectneighbours.admindesktop.ui.ui.features.theme.model;

import javafx.beans.property.ReadOnlyIntegerProperty;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;

import java.util.UUID;

public interface ReadOnlyThemeProperty {
    ReadOnlyObjectProperty<UUID> uuidProperty();
    ReadOnlyStringProperty nameProperty();
    ReadOnlyIntegerProperty redProperty();
    ReadOnlyIntegerProperty greenProperty();
    ReadOnlyIntegerProperty blueProperty();
}
