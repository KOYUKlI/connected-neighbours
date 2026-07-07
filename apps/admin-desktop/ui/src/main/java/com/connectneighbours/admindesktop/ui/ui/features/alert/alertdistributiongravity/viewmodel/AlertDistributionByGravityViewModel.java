package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.AlertDistributionByGravityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.ReadOnlyAlertDistributionByGravityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.SimpleAlertDistributionByGravityProperty;

public class AlertDistributionByGravityViewModel {
    private final SimpleAlertDistributionByGravityProperty distribution = new SimpleAlertDistributionByGravityProperty();

    public ReadOnlyAlertDistributionByGravityProperty alertDistributionByGravityProperty() {
        return distribution;
    }

    public void setDistribution(ReadOnlyAlertDistributionByGravityProperty source){
        if (source == null) {
            distribution.countProperty().set(0);
            distribution.percentageProperty().set("");
            distribution.rateProperty().set(0.0);
            return;
        }
        distribution.percentageProperty().set(source.percentageProperty().get());
        distribution.countProperty().set(source.countProperty().get());
        distribution.rateProperty().set(source.rateProperty().get());
    }
}
