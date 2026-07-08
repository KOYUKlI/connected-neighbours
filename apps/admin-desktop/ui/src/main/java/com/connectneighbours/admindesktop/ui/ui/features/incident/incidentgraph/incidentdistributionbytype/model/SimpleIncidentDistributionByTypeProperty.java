package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model;

import javafx.beans.property.*;

public class SimpleIncidentDistributionByTypeProperty implements IncidentDistributionByTypeProperty {
    private final LongProperty count = new SimpleLongProperty();
    private final DoubleProperty rate = new SimpleDoubleProperty();
    private final StringProperty percentage = new SimpleStringProperty();

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
}
