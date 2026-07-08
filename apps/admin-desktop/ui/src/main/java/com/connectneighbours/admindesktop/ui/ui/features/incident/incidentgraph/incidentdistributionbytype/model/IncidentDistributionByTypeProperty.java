package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model;

import javafx.beans.property.DoubleProperty;
import javafx.beans.property.LongProperty;
import javafx.beans.property.StringProperty;

public interface IncidentDistributionByTypeProperty extends ReadOnlyIncidentDistributionByTypeProperty {
    LongProperty countProperty();
    DoubleProperty rateProperty();
    StringProperty percentageProperty();
}
