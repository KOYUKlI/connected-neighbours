package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import javafx.beans.property.*;

public class SimpleIncidentDistributionByTypeProperty implements IncidentDistributionByTypeProperty {
    private final LongProperty count = new SimpleLongProperty();
    private final DoubleProperty rate = new SimpleDoubleProperty();
    private final StringProperty percentage = new SimpleStringProperty();
    private final ObjectProperty<IncidentType> type = new SimpleObjectProperty<>();

    @Override
    public LongProperty countProperty() {
        return count;
    }

    @Override
    public DoubleProperty rateProperty() {
        return rate;
    }

    @Override
    public StringProperty percentageProperty() {
        return percentage;
    }

    @Override
    public ObjectProperty<IncidentType> typeProperty() {
        return type;
    }
}
