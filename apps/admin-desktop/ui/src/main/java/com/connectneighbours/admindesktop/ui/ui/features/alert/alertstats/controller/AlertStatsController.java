package com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.controller;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;

import java.io.IOException;

public class AlertStatsController extends AnchorPane {
    @FXML private Label totalAlerts;
    @FXML private Label totalAlertsCritical;

    public AlertStatsController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("../view/alert-stats-view.fxml"));
        loader.setRoot(this);
        loader.setController(this);
        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public void setTotalAlerts(Long alerts) {
        totalAlerts.setText(alerts.toString());
    }

    public void setTotalAlertsCritical(Long alertsCritical) {
        totalAlertsCritical.setText(alertsCritical.toString());
    }
}
