package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import javafx.beans.property.ReadOnlyStringProperty;

public interface ReadOnlyWidgetAlertProperty {
    ReadOnlyStringProperty severityProperty();
    ReadOnlyStringProperty statusProperty();
    ReadOnlyReporterProperty reporterProperty();
    ReadOnlyStringProperty messageProperty();
}
