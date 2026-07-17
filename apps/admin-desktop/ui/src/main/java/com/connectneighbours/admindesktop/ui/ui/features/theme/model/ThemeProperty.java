package com.connectneighbours.admindesktop.ui.ui.features.theme.model;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;

import java.util.UUID;

public interface ThemeProperty extends ReadOnlyThemeProperty {
    ObjectProperty<UUID> uuidProperty();
    StringProperty nameProperty();
    IntegerProperty redProperty();
    IntegerProperty greenProperty();
    IntegerProperty blueProperty();
}
