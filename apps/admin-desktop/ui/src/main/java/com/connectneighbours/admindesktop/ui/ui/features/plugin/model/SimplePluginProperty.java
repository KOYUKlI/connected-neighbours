package com.connectneighbours.admindesktop.ui.ui.features.plugin.model;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.StatePlugin;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

import java.util.UUID;

public class SimplePluginProperty implements PluginProperty {
    private final ObjectProperty<UUID> uuid = new SimpleObjectProperty<>();
    private final StringProperty name = new SimpleStringProperty();
    private final StringProperty version = new SimpleStringProperty();
    private final StringProperty author = new SimpleStringProperty();
    private final StringProperty description = new SimpleStringProperty();
    private final ObjectProperty<StatePlugin> statePlugin = new SimpleObjectProperty<>();

    @Override
    public ObjectProperty<UUID> uuidProperty() {
        return uuid;
    }

    @Override
    public StringProperty nameProperty() {
        return name;
    }

    @Override
    public StringProperty versionProperty() {
        return version;
    }

    @Override
    public StringProperty authorProperty() {
        return author;
    }

    @Override
    public StringProperty descriptionProperty() {
        return description;
    }

    @Override
    public ObjectProperty<StatePlugin> statePluginProperty() {
        return statePlugin;
    }
}
