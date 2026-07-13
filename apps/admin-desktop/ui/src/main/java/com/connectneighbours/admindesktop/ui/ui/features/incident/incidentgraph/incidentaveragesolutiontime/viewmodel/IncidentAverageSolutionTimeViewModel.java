package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model.ReadOnlyIncidentAverageSolutionTimeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model.SimpleIncidentAverageSolutionTimeProperty;

public class IncidentAverageSolutionTimeViewModel {
    private final SimpleIncidentAverageSolutionTimeProperty incident = new SimpleIncidentAverageSolutionTimeProperty();

    public ReadOnlyIncidentAverageSolutionTimeProperty incidentAverageSolutionTimeProperty() {
        return incident;
    }

    public void setIncidentAverageSolutionTime(ReadOnlyIncidentAverageSolutionTimeProperty source) {
        if (source == null) {
            incident.countProperty().set(0L);
            incident.dateTimeProperty().set(null);
            incident.durationProperty().set(0L);
            return;
        }

        incident.countProperty().set(source.countProperty().get());
        incident.dateTimeProperty().set(source.dateTimeProperty().get());
        incident.durationProperty().set(source.durationProperty().get());
    }

}
