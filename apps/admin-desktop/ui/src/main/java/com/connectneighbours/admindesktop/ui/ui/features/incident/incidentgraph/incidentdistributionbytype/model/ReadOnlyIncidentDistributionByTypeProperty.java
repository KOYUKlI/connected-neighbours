package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import javafx.beans.property.*;

public interface ReadOnlyIncidentDistributionByTypeProperty {
    ReadOnlyLongProperty countProperty();
    ReadOnlyDoubleProperty rateProperty();
    ReadOnlyStringProperty percentageProperty();
    ReadOnlyObjectProperty<IncidentType> typeProperty();
}
