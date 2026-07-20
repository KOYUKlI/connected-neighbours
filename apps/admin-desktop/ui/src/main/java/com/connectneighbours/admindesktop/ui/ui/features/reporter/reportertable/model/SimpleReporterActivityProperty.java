package com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.model;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class SimpleReporterActivityProperty implements ReporterActivityProperty {
    private final StringProperty fullName = new SimpleStringProperty();
    private final StringProperty role = new SimpleStringProperty();
    private final IntegerProperty incidentCount = new SimpleIntegerProperty();
    private final IntegerProperty alertCount = new SimpleIntegerProperty();

    @Override
    public StringProperty fullNameProperty() {
        return fullName;
    }

    @Override
    public StringProperty roleProperty() {
        return role;
    }

    @Override
    public IntegerProperty incidentCountProperty() {
        return incidentCount;
    }

    @Override
    public IntegerProperty alertCountProperty() {
        return alertCount;
    }
}
