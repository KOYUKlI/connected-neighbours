package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model;

import javafx.beans.property.LongProperty;
import javafx.beans.property.ReadOnlyDoubleProperty;
import javafx.beans.property.ReadOnlyLongProperty;
import javafx.beans.property.ReadOnlyStringProperty;

public interface ReadOnlyIncidentDistributionByTypeProperty {
    ReadOnlyLongProperty countProperty();
    ReadOnlyDoubleProperty rateProperty();
    ReadOnlyStringProperty percentageProperty();
}
