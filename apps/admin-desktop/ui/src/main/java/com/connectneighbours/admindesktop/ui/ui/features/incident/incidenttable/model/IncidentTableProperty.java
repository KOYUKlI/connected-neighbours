package com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import javafx.beans.property.IntegerProperty;
import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;

import java.time.LocalDateTime;

public interface IncidentTableProperty extends ReadOnlyIncidentTableProperty {
    StringProperty incidentIdProperty();

    StringProperty titleProperty();

    StringProperty typeProperty();

    StringProperty statusProperty();

    ReporterProperty reporterProperty();

    ObjectProperty<LocalDateTime> createdAtProperty();

    ObjectProperty<LocalDateTime> resolvedAtProperty();

    IntegerProperty alertsCountProperty();

}
