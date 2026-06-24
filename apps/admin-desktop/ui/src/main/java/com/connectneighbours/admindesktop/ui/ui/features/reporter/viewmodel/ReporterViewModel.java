package com.connectneighbours.admindesktop.ui.ui.features.reporter.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;

public class ReporterViewModel {

    private final SimpleReporterProperty reporter = new SimpleReporterProperty();

    public ReadOnlyReporterProperty reporterProperty() {
        return reporter;
    }

    public void setReporter(ReadOnlyReporterProperty source) {
        if (source == null) {
            reporter.firstnameProperty().set("");
            reporter.lastnameProperty().set("");
            reporter.avatarProperty().set(null);
            return;
        }

        reporter.firstnameProperty().set(source.firstnameProperty().get());
        reporter.lastnameProperty().set(source.lastnameProperty().get());
        reporter.avatarProperty().set(source.avatarProperty().get());
    }
}
