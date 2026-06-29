package com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model.ReadOnlyAlertStatsProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model.SimpleAlertStatsProperty;

public class AlertStatViewModel {
    private final SimpleAlertStatsProperty stats = new SimpleAlertStatsProperty();

    public ReadOnlyAlertStatsProperty alertStatsProperty() {
        return stats;
    }

    public void setStats(ReadOnlyAlertStatsProperty source) {
        if (source == null) {
            stats.totalAlertsProperty().set(0);
            stats.totalAlertsCriticalProperty().set(0);
            stats.averageResolutionTimeProperty().set(0);
            return;
        }

        stats.totalAlertsProperty().set(source.totalAlertsProperty().get());
        stats.totalAlertsCriticalProperty().set(source.totalAlertsCriticalProperty().get());
        stats.averageResolutionTimeProperty().set(source.averageResolutionTimeProperty().get());
    }
}
