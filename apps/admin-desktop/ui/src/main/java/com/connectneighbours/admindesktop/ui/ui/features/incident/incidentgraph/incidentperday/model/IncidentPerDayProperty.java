package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;

import java.time.LocalDateTime;

public interface IncidentPerDayProperty extends ReadOnlyIncidentPerDayProperty{
    LongProperty countProperty();
    ObjectProperty<IncidentType> typeProperty();
    ObjectProperty<LocalDateTime> dateTimeProperty();
}
