package com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model.ReadOnlyCreateIncidentProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model.SimpleCreateIncidentProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;

public class CreateIncidentViewModel {
    private final SimpleCreateIncidentProperty createIncidentProperty = new SimpleCreateIncidentProperty();

    public ReadOnlyCreateIncidentProperty getCreateIncidentProperty() {
        return createIncidentProperty;
    }

    public void setCreateIncidentProperty(ReadOnlyCreateIncidentProperty source) {
        if (source == null) {
            createIncidentProperty.reporterProperty().set(new SimpleReporterProperty());
            createIncidentProperty.titleProperty().set("");
            createIncidentProperty.descriptionProperty().set("");
            createIncidentProperty.typeProperty().set(null);
            createIncidentProperty.severityProperty().set(null);
            return;
        }

        createIncidentProperty.reporterProperty().set(source.reporterProperty().get());
        createIncidentProperty.titleProperty().set(source.titleProperty().get());
        createIncidentProperty.descriptionProperty().set(source.descriptionProperty().get());
        createIncidentProperty.typeProperty().set(source.typeProperty().get());
        createIncidentProperty.severityProperty().set(source.severityProperty().get());
    }
}
