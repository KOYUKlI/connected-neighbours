package com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.model;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.StringProperty;

public interface ReporterActivityProperty extends ReadOnlyReporterActivityProperty {
    StringProperty fullNameProperty();

    StringProperty roleProperty();

    IntegerProperty incidentCountProperty();

    IntegerProperty alertCountProperty();
}
