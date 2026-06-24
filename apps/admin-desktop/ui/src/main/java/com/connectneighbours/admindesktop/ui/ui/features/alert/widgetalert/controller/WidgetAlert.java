package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.controller;

import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.viewmodel.WidgetAlertViewModel;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;

import java.io.IOException;

public class WidgetAlert extends AnchorPane {
    @FXML private Label titleLabel;
    private final WidgetAlertViewModel vm = new WidgetAlertViewModel();

    public WidgetAlert() {
        FXMLLoader loader = new FXMLLoader(
                getClass().getResource(
                        "/com/connectneighbours/admindesktop/ui/ui/features/alert/widgetalert/view/widget-alert-view.fxml"
                )
        );
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
        titleLabel.textProperty().bind(vm.alertProperty().messageProperty());
    }
}


