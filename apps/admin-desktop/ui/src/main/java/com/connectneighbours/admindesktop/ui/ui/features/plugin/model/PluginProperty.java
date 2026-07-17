package com.connectneighbours.admindesktop.ui.ui.features.plugin.model;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.StatePlugin;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;

import java.util.UUID;

public interface PluginProperty extends ReadOnlyPluginProperty {
    ObjectProperty<UUID> uuidProperty();
    StringProperty nameProperty();
    StringProperty versionProperty();
    StringProperty authorProperty();
    StringProperty descriptionProperty();
    ObjectProperty<StatePlugin> statePluginProperty();
}
