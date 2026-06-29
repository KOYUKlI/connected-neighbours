package com.connectneighbours.admindesktop.ui.ui.features.reporter.model;

import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;
import javafx.scene.image.Image;

public interface ReporterProperty extends ReadOnlyReporterProperty{
    StringProperty firstnameProperty();
    StringProperty lastnameProperty();
    StringProperty fullNameProperty();
    ObjectProperty<Image> avatarProperty();

    void set(ReporterDTO source);
    void set(ReporterProperty source);
}
