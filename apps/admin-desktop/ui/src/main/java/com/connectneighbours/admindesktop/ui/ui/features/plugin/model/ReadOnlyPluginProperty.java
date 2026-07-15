package com.connectneighbours.admindesktop.ui.ui.features.plugin.model;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.StatePlugin;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;

import java.util.UUID;

public interface ReadOnlyPluginProperty {
    ReadOnlyObjectProperty<UUID> uuidProperty();
    ReadOnlyStringProperty nameProperty();
    ReadOnlyStringProperty versionProperty();
    ReadOnlyStringProperty authorProperty();
    ReadOnlyStringProperty descriptionProperty();
    ReadOnlyObjectProperty<StatePlugin> statePluginProperty();
}
