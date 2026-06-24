package com.connectneighbours.admindesktop.ui.ui.features.reporter.model;

import javafx.beans.property.*;
import javafx.scene.image.Image;

public class SimpleReporterProperty implements ReporterProperty {
    private final StringProperty firstname = new SimpleStringProperty();
    private final StringProperty lastname = new SimpleStringProperty();
    private final ObjectProperty<Image> avatar = new SimpleObjectProperty<>();

    @Override
    public StringProperty firstnameProperty() {
        return firstname;
    }

    @Override
    public StringProperty lastnameProperty() {
        return lastname;
    }

    @Override
    public ObjectProperty<Image> avatarProperty() {
        return avatar;
    }

}
