package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class SimpleWidgetAlertProperty implements WidgetAlertProperty {

    private final StringProperty severity = new SimpleStringProperty();
    private final StringProperty status = new SimpleStringProperty();
    private final ReporterProperty reporter = new SimpleReporterProperty();
    private final StringProperty message = new SimpleStringProperty();

    @Override
    public StringProperty severityProperty() {
        return severity;
    }

    @Override
    public StringProperty statusProperty() {
        return status;
    }

    @Override
    public ReporterProperty reporterProperty() {
        return reporter;
    }

    @Override
    public StringProperty messageProperty() {
        return message;
    }

}
