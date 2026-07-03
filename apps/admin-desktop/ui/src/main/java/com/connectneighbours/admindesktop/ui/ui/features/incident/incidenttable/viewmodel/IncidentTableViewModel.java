package com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.viewmodel;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.ReadOnlyIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.SimpleIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;

public class IncidentTableViewModel {
    private final SimpleIncidentTableProperty incidentTable = new SimpleIncidentTableProperty();

    private IncidentDTO dto;

    public IncidentDTO getDto() {
        return dto;
    }

    public void setDto(IncidentDTO dto) {
        this.dto = dto;
    }


    public ReadOnlyIncidentTableProperty incidentTableProperty() {
        return incidentTable;
    }

    public void setIncidentTable(ReadOnlyIncidentTableProperty source) {
        if (source == null) {
            incidentTable.incidentIdProperty().set("");
            incidentTable.titleProperty().set("");
            incidentTable.reporterProperty().set(new SimpleReporterProperty());
            incidentTable.createdAtProperty().set(null);
            incidentTable.resolvedAtProperty().set(null);
            return;
        }

        incidentTable.incidentIdProperty().set(source.incidentIdProperty().get());
        incidentTable.titleProperty().set(source.titleProperty().get());
        incidentTable.typeProperty().set(source.typeProperty().get());
        incidentTable.statusProperty().set(source.statusProperty().get());
        incidentTable.reporterProperty().set(source.reporterProperty().get());
        incidentTable.createdAtProperty().set(source.createdAtProperty().get());
        incidentTable.resolvedAtProperty().set(source.resolvedAtProperty().get());
        incidentTable.alertsCountProperty().set(source.alertsCountProperty().get());
        incidentTable.severityProperty().set(source.severityProperty().get());
    }
}
