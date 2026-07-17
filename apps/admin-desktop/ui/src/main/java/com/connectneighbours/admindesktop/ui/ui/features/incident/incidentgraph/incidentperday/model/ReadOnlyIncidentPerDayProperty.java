package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import javafx.beans.property.ReadOnlyLongProperty;
import javafx.beans.property.ReadOnlyObjectProperty;

import java.time.LocalDateTime;

public interface ReadOnlyIncidentPerDayProperty {
    ReadOnlyLongProperty countProperty();
    ReadOnlyObjectProperty<IncidentType> typeProperty();
    ReadOnlyObjectProperty<LocalDateTime> dateTimeProperty();
}
