package com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.controller;

import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model.ReadOnlyAlertStatsProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.viewmodel.AlertStatViewModel;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

import java.io.IOException;

public class AlertStatsController extends VBox {
    @FXML private Label totalAlerts;
    @FXML private Label totalAlertsCritical;
    @FXML private Label averageResolutionTime;
    private final AlertStatViewModel vm = new AlertStatViewModel();

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

    @FXML
    private void initialize() {
        totalAlerts.textProperty().bind(vm.alertStatsProperty().totalAlertsProperty().asString());
        totalAlertsCritical.textProperty().bind(vm.alertStatsProperty().totalAlertsCriticalProperty().asString());
        averageResolutionTime.textProperty().bind(vm.alertStatsProperty().averageResolutionTimeProperty().asString());
    }

    public void setAlertStats(ReadOnlyAlertStatsProperty stats) {
        vm.setStats(stats);
    }
}
