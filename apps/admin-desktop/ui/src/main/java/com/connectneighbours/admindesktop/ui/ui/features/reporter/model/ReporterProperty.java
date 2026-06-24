package com.connectneighbours.admindesktop.ui.ui.features.reporter.model;

import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;
import javafx.scene.image.Image;

public interface ReporterProperty extends ReadOnlyReporterProperty{
    StringProperty firstnameProperty();
    StringProperty lastnameProperty();
    ObjectProperty<Image> avatarProperty();
}
