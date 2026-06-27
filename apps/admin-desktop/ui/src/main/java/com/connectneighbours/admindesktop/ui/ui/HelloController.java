package com.connectneighbours.admindesktop.ui.ui;

import com.connectneighbours.admindesktop.ui.ui.features.alert.controller.AlertViewController;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class HelloController {

    private AlertViewController alertView;
    private List<Node> homeContent;

    @FXML
    private Label welcomeText;

    @FXML
    private VBox mainContainer;

    @FXML
    public void initialize() {
        homeContent = new ArrayList<>(mainContainer.getChildren());
    }


    @FXML
    protected void onHelloButtonClick() {
        welcomeText.setText("Welcome to JavaFX Application!");
    }

    @FXML
    private void goToAlerts(ActionEvent actionEvent) throws IOException {
        if (alertView == null) {
            alertView = new AlertViewController();
            alertView.setParent(this);
        }
        mainContainer.getChildren().setAll(alertView);

    }

    public void showHome() {
        mainContainer.getChildren().setAll(homeContent);
    }
}

