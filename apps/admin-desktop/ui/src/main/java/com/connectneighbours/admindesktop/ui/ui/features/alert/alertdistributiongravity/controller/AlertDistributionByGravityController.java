package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.controller;

import javafx.fxml.FXMLLoader;
import javafx.scene.layout.VBox;

import java.io.IOException;

public class AlertDistributionByGravityController extends VBox {
    public AlertDistributionByGravityController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("../view/alert-distribution-gravity-view.fxml"));
        loader.setRoot(this);
        loader.setController(this);
        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}
