package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.alertsymbol.controller;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Paint;
import javafx.scene.shape.Polygon;
import javafx.scene.text.Text;

import java.io.IOException;

public class WarningSymbolController extends Pane {

    @FXML private Polygon shape;
    @FXML private Text icon;

    public WarningSymbolController() {
        FXMLLoader loader = new FXMLLoader(
                getClass().getResource(
                        "../view/warning-symbol-view.fxml"
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

    public void setColor(Paint color) {
        shape.setFill(color);
    }

    public void setSymbol(String text) {
        icon.setText(text);
    }
}



