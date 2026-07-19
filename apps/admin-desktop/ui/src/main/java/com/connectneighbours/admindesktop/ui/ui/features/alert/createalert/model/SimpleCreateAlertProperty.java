package com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.model;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class SimpleCreateAlertProperty implements CreateAlertProperty{
    private final ReporterProperty reporter = new SimpleReporterProperty();
    private final StringProperty title = new SimpleStringProperty();
    private final StringProperty description = new SimpleStringProperty();
    private final ObjectProperty<AlertSeverity> severity = new SimpleObjectProperty<>();

    @Override
    public ReporterProperty reporterProperty() {
        return reporter;
    }

    @Override
    public StringProperty titleProperty() {
        return title;
    }

    @Override
    public StringProperty descriptionProperty() {
        return description;
    }

    @Override
    public ObjectProperty<AlertSeverity> severityProperty() {
        return severity;
    }
}
