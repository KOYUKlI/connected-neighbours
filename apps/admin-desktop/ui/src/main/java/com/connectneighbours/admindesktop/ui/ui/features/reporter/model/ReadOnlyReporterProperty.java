package com.connectneighbours.admindesktop.ui.ui.features.reporter.model;

import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;
import javafx.scene.image.Image;

public interface ReadOnlyReporterProperty {
    ReadOnlyStringProperty firstnameProperty();
    ReadOnlyStringProperty lastnameProperty();
    ReadOnlyStringProperty fullNameProperty();
    ReadOnlyObjectProperty<Image> avatarProperty();
}
