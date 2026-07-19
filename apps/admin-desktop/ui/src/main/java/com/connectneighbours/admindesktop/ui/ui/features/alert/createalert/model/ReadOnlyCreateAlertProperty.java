package com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.model;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;

public interface ReadOnlyCreateAlertProperty {
    ReadOnlyReporterProperty reporterProperty();
    ReadOnlyStringProperty titleProperty();
    ReadOnlyStringProperty descriptionProperty();
    ReadOnlyObjectProperty<AlertSeverity> severityProperty();
}
