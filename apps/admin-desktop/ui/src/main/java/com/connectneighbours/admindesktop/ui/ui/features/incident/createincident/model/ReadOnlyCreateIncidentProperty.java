package com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;

public interface ReadOnlyCreateIncidentProperty {
    ReadOnlyReporterProperty reporterProperty();
    ReadOnlyStringProperty titleProperty();
    ReadOnlyStringProperty descriptionProperty();
    ReadOnlyObjectProperty<IncidentType> typeProperty();
    ReadOnlyObjectProperty<IncidentSeverity> severityProperty();
}
