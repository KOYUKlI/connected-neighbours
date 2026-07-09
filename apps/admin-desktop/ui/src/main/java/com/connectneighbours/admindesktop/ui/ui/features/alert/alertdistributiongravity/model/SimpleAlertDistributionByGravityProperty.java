package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import javafx.beans.property.*;

public class SimpleAlertDistributionByGravityProperty implements AlertDistributionByGravityProperty{
    private final StringProperty percent = new SimpleStringProperty();
    private final LongProperty count = new SimpleLongProperty();
    private final DoubleProperty rate = new SimpleDoubleProperty();
    private final ObjectProperty<AlertSeverity> severity = new SimpleObjectProperty<>();

    @Override
    public StringProperty percentageProperty() {
        return percent;
    }

    @Override
    public DoubleProperty rateProperty() {
        return rate;
    }

    @Override
    public LongProperty countProperty() {
        return count;
    }

    @Override
    public ObjectProperty<AlertSeverity> severityProperty() {
        return severity;
    }
}
