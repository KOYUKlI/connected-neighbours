package com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.model;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.StringProperty;

public interface CreateAlertProperty extends ReadOnlyCreateAlertProperty{
    ReporterProperty reporterProperty();
    StringProperty titleProperty();
    StringProperty descriptionProperty();
    ObjectProperty<AlertSeverity> severityProperty();
}
