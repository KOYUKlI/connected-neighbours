package com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model;

import javafx.beans.property.ReadOnlyLongProperty;

public interface ReadOnlyAlertStatsProperty {
    ReadOnlyLongProperty totalAlertsProperty();
    ReadOnlyLongProperty totalAlertsCriticalProperty();
    ReadOnlyLongProperty averageResolutionTimeProperty();
}
