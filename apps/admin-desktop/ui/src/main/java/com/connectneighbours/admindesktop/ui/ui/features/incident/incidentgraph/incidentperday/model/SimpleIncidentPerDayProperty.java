package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleLongProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.time.LocalDateTime;

public class SimpleIncidentPerDayProperty implements IncidentPerDayProperty {
    private final LongProperty count = new SimpleLongProperty();
    private final ObjectProperty<IncidentType> type = new SimpleObjectProperty<>();
    private final ObjectProperty<LocalDateTime> dateTime = new SimpleObjectProperty<>();

    @Override
    public LongProperty countProperty() {
        return count;
    }

    @Override
    public ObjectProperty<IncidentType> typeProperty() {
        return type;
    }

    @Override
    public ObjectProperty<LocalDateTime> dateTimeProperty() {
        return dateTime;
    }
}
