package com.connectneighbours.admindesktop.ui.ui.features.reporter.model;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.controller.WidgetAlertController;
import javafx.beans.binding.Bindings;
import javafx.beans.property.*;
import javafx.scene.image.Image;

import java.util.Objects;

public class SimpleReporterProperty implements ReporterProperty {
    private final StringProperty firstname = new SimpleStringProperty();
    private final StringProperty lastname = new SimpleStringProperty();
    private final ObjectProperty<Image> avatar = new SimpleObjectProperty<>();
    private final StringProperty fullName = new SimpleStringProperty();

    public SimpleReporterProperty() {
        fullName.bind(
                Bindings.createStringBinding(() -> {
                    String f = firstname.get();
                    String l = lastname.get();
                    return ((f != null ? f : "") + " " + (l != null ? l : "")).trim();
                }, firstname, lastname)
        );

    }

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

    @Override
    public StringProperty fullNameProperty() {
        return fullName;
    }

    @Override
    public void set(ReporterDTO source) {
        if (source == null) {
            firstnameProperty().set("");
            lastnameProperty().set("");
            avatarProperty().set(null);
            return;
        }

        firstnameProperty().set(source.firstname());
        lastnameProperty().set(source.lastname());
        avatarProperty().set(
                new Image(
                        Objects.requireNonNull(
                                WidgetAlertController.class.getResource(source.avatarPath())
                        ).toExternalForm()
                )
        );
    }
}
