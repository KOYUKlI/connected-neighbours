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
            alert.messageProperty().set("");
            alert.reporterProperty().firstnameProperty().set("");
            alert.reporterProperty().lastnameProperty().set("");
            alert.reporterProperty().avatarProperty().set(null);
            return;
        }

        alert.severityProperty().set(source.severityProperty().get());
        alert.statusProperty().set(source.statusProperty().get());
        alert.messageProperty().set(source.messageProperty().get());

        alert.reporterProperty().firstnameProperty().set(source.reporterProperty().firstnameProperty().get());
        alert.reporterProperty().lastnameProperty().set(source.reporterProperty().lastnameProperty().get());
        alert.reporterProperty().avatarProperty().set(source.reporterProperty().avatarProperty().get());
    }
}


