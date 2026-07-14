package com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;

public interface CreateIncidentProperty extends ReadOnlyCreateIncidentProperty{
    ReporterProperty reporterProperty();
    StringProperty titleProperty();
    StringProperty descriptionProperty();
    ObjectProperty<IncidentType> typeProperty();
    ObjectProperty<IncidentSeverity> severityProperty();
}
