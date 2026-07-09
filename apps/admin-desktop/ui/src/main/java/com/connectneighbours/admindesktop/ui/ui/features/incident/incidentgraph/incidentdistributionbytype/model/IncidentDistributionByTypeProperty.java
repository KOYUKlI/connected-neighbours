package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import javafx.beans.property.DoubleProperty;
import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;

public interface IncidentDistributionByTypeProperty extends ReadOnlyIncidentDistributionByTypeProperty {
    LongProperty countProperty();
    DoubleProperty rateProperty();
    StringProperty percentageProperty();
    ObjectProperty<IncidentType> typeProperty();
}
