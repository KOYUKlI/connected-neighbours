package com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.model;

import javafx.beans.property.ReadOnlyIntegerProperty;
import javafx.beans.property.ReadOnlyStringProperty;

public interface ReadOnlyReporterActivityProperty {
    ReadOnlyStringProperty fullNameProperty();

    ReadOnlyStringProperty roleProperty();

    ReadOnlyIntegerProperty incidentCountProperty();

    ReadOnlyIntegerProperty alertCountProperty();
}
