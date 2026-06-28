package com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model;

import javafx.beans.property.LongProperty;
import javafx.beans.property.SimpleLongProperty;

public class SimpleAlertStatsProperty implements AlertStatsProperty{
    private final LongProperty totalAlerts = new SimpleLongProperty();
    private final LongProperty totalAlertsCritical = new SimpleLongProperty();
    private final LongProperty averageResolutionTime = new SimpleLongProperty();

    @Override
    public LongProperty totalAlertsProperty() {
        return totalAlerts;
    }

    @Override
    public LongProperty totalAlertsCriticalProperty() {
        return totalAlertsCritical;
    }

    @Override
    public LongProperty averageResolutionTimeProperty() {
        return averageResolutionTime;
    }
}
