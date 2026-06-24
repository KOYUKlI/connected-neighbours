package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import javafx.beans.property.StringProperty;

public interface WidgetAlertProperty extends ReadOnlyWidgetAlertProperty {
    StringProperty severityProperty();
    StringProperty statusProperty();
    ReporterProperty reporterProperty();
    StringProperty messageProperty();
}
