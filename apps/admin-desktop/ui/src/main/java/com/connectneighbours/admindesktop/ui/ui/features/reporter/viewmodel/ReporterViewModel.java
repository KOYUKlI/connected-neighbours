package com.connectneighbours.admindesktop.ui.ui.features.reporter.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.controller.WidgetAlertController;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.scene.image.Image;

import java.util.Objects;

public class ReporterViewModel {

    private final SimpleReporterProperty reporter = new SimpleReporterProperty();

    public ReadOnlyReporterProperty reporterProperty() {
        return reporter;
    }

    public void setReporter(ReadOnlyReporterProperty source) {
        if (source == null) {
            reporter.firstnameProperty().set("");
            reporter.lastnameProperty().set("");
            reporter.avatarProperty().set(
                    new Image(Objects.requireNonNull(WidgetAlertController.class
                                    .getResource("/assets/default_avatar.png"))
                            .toExternalForm())
            );

            return;
        }

        reporter.firstnameProperty().set(source.firstnameProperty().get());
        reporter.lastnameProperty().set(source.lastnameProperty().get());
        reporter.avatarProperty().set(source.avatarProperty().get());
    }
}
