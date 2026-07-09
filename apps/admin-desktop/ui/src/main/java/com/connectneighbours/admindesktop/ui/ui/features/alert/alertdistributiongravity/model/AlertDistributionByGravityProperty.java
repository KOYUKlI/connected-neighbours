package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import javafx.beans.property.DoubleProperty;
import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;

public interface AlertDistributionByGravityProperty extends ReadOnlyAlertDistributionByGravityProperty{
    StringProperty percentageProperty();
    DoubleProperty rateProperty();
    LongProperty countProperty();
    ObjectProperty<AlertSeverity> severityProperty();
}
