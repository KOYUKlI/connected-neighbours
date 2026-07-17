package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model;

import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleLongProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.time.LocalDateTime;

public class SimpleIncidentAverageSolutionTimeProperty implements IncidentAverageSolutionTimeProperty {
    private final LongProperty count = new SimpleLongProperty();
    private final ObjectProperty<LocalDateTime> dateTime = new SimpleObjectProperty<>();
    private final LongProperty duration = new SimpleLongProperty();


    @Override
    public LongProperty countProperty() {
        return count;
    }

    @Override
    public ObjectProperty<LocalDateTime> dateTimeProperty() {
        return dateTime;
    }

    @Override
    public LongProperty durationProperty() {
        return duration;
    }
}
