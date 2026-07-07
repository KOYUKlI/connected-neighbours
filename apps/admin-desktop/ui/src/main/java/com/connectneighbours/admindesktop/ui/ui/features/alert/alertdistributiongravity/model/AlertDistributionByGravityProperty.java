package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model;

import javafx.beans.property.DoubleProperty;
import javafx.beans.property.LongProperty;
import javafx.beans.property.StringProperty;

public interface AlertDistributionByGravityProperty extends ReadOnlyAlertDistributionByGravityProperty{
    StringProperty percentageProperty();
    DoubleProperty rateProperty();
    LongProperty countProperty();
}
