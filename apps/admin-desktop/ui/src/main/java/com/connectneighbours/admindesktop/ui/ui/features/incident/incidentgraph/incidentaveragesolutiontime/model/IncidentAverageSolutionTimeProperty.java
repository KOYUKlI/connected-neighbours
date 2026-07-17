package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model;

import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;

import java.time.LocalDateTime;

public interface IncidentAverageSolutionTimeProperty extends ReadOnlyIncidentAverageSolutionTimeProperty{
    LongProperty countProperty();
    ObjectProperty<LocalDateTime> dateTimeProperty();
    LongProperty durationProperty();
}
