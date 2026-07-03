package com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import javafx.beans.property.ReadOnlyIntegerProperty;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;

import java.time.LocalDateTime;

public interface ReadOnlyIncidentTableProperty {
    ReadOnlyStringProperty incidentIdProperty();

    ReadOnlyStringProperty titleProperty();

    ReadOnlyStringProperty typeProperty();

    ReadOnlyStringProperty statusProperty();

    ReadOnlyReporterProperty reporterProperty();

    ReadOnlyObjectProperty<LocalDateTime> createdAtProperty();

    ReadOnlyObjectProperty<LocalDateTime> resolvedAtProperty();

    ReadOnlyIntegerProperty alertsCountProperty();

    ReadOnlyStringProperty severityProperty();
}
