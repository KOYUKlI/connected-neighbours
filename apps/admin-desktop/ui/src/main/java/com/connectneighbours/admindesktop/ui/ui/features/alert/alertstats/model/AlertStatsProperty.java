package com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model;

import javafx.beans.property.LongProperty;

public interface AlertStatsProperty extends ReadOnlyAlertStatsProperty{
    LongProperty totalAlertsProperty();
    LongProperty totalAlertsCriticalProperty();
    LongProperty averageResolutionTimeProperty();
}
