package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import javafx.beans.property.ReadOnlyDoubleProperty;
import javafx.beans.property.ReadOnlyLongProperty;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;

public interface ReadOnlyAlertDistributionByGravityProperty {
    ReadOnlyStringProperty percentageProperty();
    ReadOnlyDoubleProperty rateProperty();
    ReadOnlyLongProperty countProperty();
    ReadOnlyObjectProperty<AlertSeverity> severityProperty();
}
