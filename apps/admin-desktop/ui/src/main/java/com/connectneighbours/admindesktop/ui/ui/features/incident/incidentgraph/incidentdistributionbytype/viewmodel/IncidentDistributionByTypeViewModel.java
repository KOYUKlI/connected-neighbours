package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.viewmodel;

import com.connectneighbours.admindesktop.back.application.statistics.FormatPercentage;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model.ReadOnlyIncidentDistributionByTypeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model.SimpleIncidentDistributionByTypeProperty;

public class IncidentDistributionByTypeViewModel {

    private final SimpleIncidentDistributionByTypeProperty distribution = new SimpleIncidentDistributionByTypeProperty();

    public ReadOnlyIncidentDistributionByTypeProperty distributionProperty() {
        return distribution;
    }

    public void setDistribution(ReadOnlyIncidentDistributionByTypeProperty source) {
        if (source == null) {
            distribution.countProperty().set(0);
            distribution.rateProperty().set(0.0);
            distribution.percentageProperty().set(FormatPercentage.formatPercentage(0.0));
            distribution.typeProperty().set(null);
            return;
        }

        distribution.countProperty().set(source.countProperty().get());
        distribution.rateProperty().set(source.rateProperty().get());
        distribution.percentageProperty().set(source.percentageProperty().get());
        distribution.typeProperty().set(source.typeProperty().get());
    }
}
