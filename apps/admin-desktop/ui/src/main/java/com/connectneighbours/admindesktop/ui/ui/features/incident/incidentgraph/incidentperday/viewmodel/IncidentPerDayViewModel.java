package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model.ReadOnlyIncidentPerDayProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model.SimpleIncidentPerDayProperty;

public class IncidentPerDayViewModel {
    private final SimpleIncidentPerDayProperty incidentPerDayProperty = new SimpleIncidentPerDayProperty();

    public ReadOnlyIncidentPerDayProperty incidentPerDayProperty() {
        return incidentPerDayProperty;
    }

    public void setIncidentPerDayProperty(ReadOnlyIncidentPerDayProperty source) {
        if (source == null) {
            incidentPerDayProperty.countProperty().set(0);
            incidentPerDayProperty.typeProperty().set(null);
            incidentPerDayProperty.dateTimeProperty().set(null);
            return;
        }

        incidentPerDayProperty.countProperty().set(source.countProperty().get());
        incidentPerDayProperty.typeProperty().set(source.typeProperty().get());
        incidentPerDayProperty.dateTimeProperty().set(source.dateTimeProperty().get());
    }
}
