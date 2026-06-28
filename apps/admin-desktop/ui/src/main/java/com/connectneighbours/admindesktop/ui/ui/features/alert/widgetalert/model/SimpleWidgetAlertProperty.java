package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

import java.time.LocalDateTime;

public class SimpleWidgetAlertProperty implements WidgetAlertProperty {

    private final StringProperty severity = new SimpleStringProperty();
    private final StringProperty status = new SimpleStringProperty();
    private final ReporterProperty reporter = new SimpleReporterProperty();
    private final StringProperty details = new SimpleStringProperty();
    private final StringProperty title = new SimpleStringProperty();
    private final StringProperty reporterName = new SimpleStringProperty();
    private final ObjectProperty<LocalDateTime> createdAt = new SimpleObjectProperty<>();
    private final ObjectProperty<LocalDateTime> resolvedAt = new SimpleObjectProperty<>();

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
    public StringProperty detailsProperty() {
        return details;
    }

    @Override
    public StringProperty titleProperty() {
        return title;
    }

    @Override
    public StringProperty reporterNameProperty() {
        return reporterName;
    }

    @Override
    public ObjectProperty<LocalDateTime> createdAtProperty() {
        return createdAt;
    }

    @Override
    public ObjectProperty<LocalDateTime> resolvedAtProperty() {
        return resolvedAt;
    }

}
