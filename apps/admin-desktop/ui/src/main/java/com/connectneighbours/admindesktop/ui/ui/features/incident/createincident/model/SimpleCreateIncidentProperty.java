package com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class SimpleCreateIncidentProperty implements CreateIncidentProperty{
    private final ReporterProperty reporter = new SimpleReporterProperty();
    private final StringProperty title = new SimpleStringProperty();
    private final StringProperty description = new SimpleStringProperty();
    private final ObjectProperty<IncidentType> type = new SimpleObjectProperty<>();
    private final ObjectProperty<IncidentSeverity> severity = new SimpleObjectProperty<>();

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
    public ObjectProperty<IncidentType> typeProperty() {
        return type;
    }

    @Override
    public ObjectProperty<IncidentSeverity> severityProperty() {
        return severity;
    }
}
