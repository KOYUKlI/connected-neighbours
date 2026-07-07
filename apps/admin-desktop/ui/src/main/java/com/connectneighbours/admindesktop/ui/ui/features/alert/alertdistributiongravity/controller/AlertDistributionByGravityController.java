package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.controller;

import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.ReadOnlyAlertDistributionByGravityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.viewmodel.AlertDistributionByGravityViewModel;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Group;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Arc;

import java.io.IOException;
import java.util.List;

public class AlertDistributionByGravityController extends VBox {
    @FXML
    private Group graphDistribution;
    @FXML
    private Arc redDistribution;
    @FXML
    private Arc orangeDistribution;
    @FXML
    private Arc greenDistribution;
    @FXML
    private Arc blueDistribution;

    private final AlertDistributionByGravityViewModel vmCritical = new AlertDistributionByGravityViewModel();
    private final AlertDistributionByGravityViewModel vmHigh = new AlertDistributionByGravityViewModel();
    private final AlertDistributionByGravityViewModel vmMedium = new AlertDistributionByGravityViewModel();
    private final AlertDistributionByGravityViewModel vmLow = new AlertDistributionByGravityViewModel();

    public AlertDistributionByGravityController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/alert/alertdistributiongravity/view/alert-distribution-gravity-view.fxml"
        ));
        loader.setRoot(this);
        loader.setController(this);
        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @FXML
    void initialize() {
        redDistribution.lengthProperty().bind(vmCritical.alertDistributionByGravityProperty().rateProperty().multiply(360));
        blueDistribution.lengthProperty().bind(vmHigh.alertDistributionByGravityProperty().rateProperty().multiply(360));
        orangeDistribution.lengthProperty().bind(vmMedium.alertDistributionByGravityProperty().rateProperty().multiply(360));
        greenDistribution.lengthProperty().bind(vmLow.alertDistributionByGravityProperty().rateProperty().multiply(360));
    }


    public void setRedDistribution(ReadOnlyAlertDistributionByGravityProperty distribution) {
        vmCritical.setDistribution(distribution);
    }

    public void setBlueDistribution(ReadOnlyAlertDistributionByGravityProperty distribution) {
        vmHigh.setDistribution(distribution);
    }

    public void setOrangeDistribution(ReadOnlyAlertDistributionByGravityProperty distribution) {
        vmMedium.setDistribution(distribution);
    }

    public void setGreenDistribution(ReadOnlyAlertDistributionByGravityProperty distribution) {
        vmLow.setDistribution(distribution);
    }
}
