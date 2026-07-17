package com.connectneighbours.admindesktop.ui.ui.features.theme.model;

import javafx.beans.property.*;

import java.util.UUID;

public class SimpleThemeProperty implements ThemeProperty {
    private final ObjectProperty<UUID> uuid = new SimpleObjectProperty<>();
    private final StringProperty name = new SimpleStringProperty();
    private final IntegerProperty red = new SimpleIntegerProperty();
    private final IntegerProperty green = new SimpleIntegerProperty();
    private final IntegerProperty blue = new SimpleIntegerProperty();

    @Override
    public ObjectProperty<UUID> uuidProperty() {
        return uuid;
    }

    @Override
    public StringProperty nameProperty() {
        return name;
    }

    @Override
    public IntegerProperty redProperty() {
        return red;
    }

    @Override
    public IntegerProperty greenProperty() {
        return green;
    }

    @Override
    public IntegerProperty blueProperty() {
        return blue;
    }
}
