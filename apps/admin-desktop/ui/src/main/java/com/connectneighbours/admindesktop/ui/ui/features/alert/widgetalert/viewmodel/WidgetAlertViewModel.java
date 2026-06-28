package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model.ReadOnlyWidgetAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model.SimpleWidgetAlertProperty;

public class WidgetAlertViewModel {

    private final SimpleWidgetAlertProperty alert = new SimpleWidgetAlertProperty();

    public ReadOnlyWidgetAlertProperty alertProperty() {
        return alert;
    }

    public void setAlert(ReadOnlyWidgetAlertProperty source) {
        if (source == null) {
            alert.severityProperty().set("");
            alert.statusProperty().set("");
            alert.detailsProperty().set("");
            alert.titleProperty().set("");
            alert.reporterNameProperty().set("");

            alert.reporterProperty().firstnameProperty().set("");
            alert.reporterProperty().lastnameProperty().set("");
            alert.reporterProperty().avatarProperty().set(null);
            return;
        }

        alert.severityProperty().set(source.severityProperty().get());
        alert.statusProperty().set(source.statusProperty().get());
        alert.detailsProperty().set(source.detailsProperty().get());
        alert.titleProperty().set(source.titleProperty().get());

        alert.reporterProperty().avatarProperty().set(source.reporterProperty().avatarProperty().get());
        alert.reporterNameProperty().set(source.reporterNameProperty().get());
        alert.createdAtProperty().set(source.createdAtProperty().get());
        alert.resolvedAtProperty().set(source.createdAtProperty().get());

    }



}


