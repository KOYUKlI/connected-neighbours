package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model;

import javafx.beans.property.ReadOnlyLongProperty;
import javafx.beans.property.ReadOnlyObjectProperty;

import java.time.LocalDateTime;

public interface ReadOnlyIncidentAverageSolutionTimeProperty {
    ReadOnlyLongProperty countProperty();
    ReadOnlyObjectProperty<LocalDateTime> dateTimeProperty();
    ReadOnlyLongProperty durationProperty();
}
