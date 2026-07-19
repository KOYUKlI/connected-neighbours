package com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.beans.property.*;

import java.time.LocalDateTime;

public class SimpleIncidentTableProperty implements IncidentTableProperty {
    private final StringProperty incidentId = new SimpleStringProperty();
    private final StringProperty title = new SimpleStringProperty();
    private final StringProperty type = new SimpleStringProperty();
    private final StringProperty status = new SimpleStringProperty();
    private final ReporterProperty reporter = new SimpleReporterProperty();
    private final ObjectProperty<LocalDateTime> createdAt = new SimpleObjectProperty<>();
    private final ObjectProperty<LocalDateTime> resolvedAt = new SimpleObjectProperty<>();
    private final IntegerProperty alertCount = new SimpleIntegerProperty();
    private final StringProperty severity = new SimpleStringProperty();


    @Override
    public StringProperty incidentIdProperty() {
        return incidentId;
    }

    @Override
    public StringProperty titleProperty() {
        return title;
    }

    @Override
    public StringProperty typeProperty() {
        return type;
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
    public ObjectProperty<LocalDateTime> createdAtProperty() {
        return createdAt;
    }

    @Override
    public ObjectProperty<LocalDateTime> resolvedAtProperty() {
        return resolvedAt;
    }

    @Override
    public IntegerProperty alertsCountProperty() {
        return alertCount;
    }

    @Override
    public StringProperty severityProperty() {
        return severity;
    }
}
