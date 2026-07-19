package com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.model.ReadOnlyCreateAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.model.SimpleCreateAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;

public class CreateAlertViewModel {
    private final SimpleCreateAlertProperty createAlertProperty = new SimpleCreateAlertProperty();

    public ReadOnlyCreateAlertProperty getCreateAlertProperty() {
        return createAlertProperty;
    }

    public void setCreateAlertProperty(ReadOnlyCreateAlertProperty source) {
        if (source == null) {
            createAlertProperty.reporterProperty().set(new SimpleReporterProperty());
            createAlertProperty.titleProperty().set("");
            createAlertProperty.descriptionProperty().set("");
            createAlertProperty.severityProperty().set(null);
            return;
        }

        createAlertProperty.reporterProperty().set(source.reporterProperty().get());
        createAlertProperty.titleProperty().set(source.titleProperty().get());
        createAlertProperty.descriptionProperty().set(source.descriptionProperty().get());
        createAlertProperty.severityProperty().set(source.severityProperty().get());
    }
}
