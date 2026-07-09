package com.connectneighbours.admindesktop.ui.ui.features.reporter.controller;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.viewmodel.ReporterViewModel;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;

import java.io.IOException;

public class ReporterWidget extends HBox {

    @FXML
    private ImageView avatarImage;

    @FXML
    private Label reporterNameLabel;

    private final ReporterViewModel viewModel = new ReporterViewModel();

    public ReporterWidget() {
        FXMLLoader loader = new FXMLLoader(
                ReporterWidget.class.getResource("../view/reporter-widget-view.fxml")
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
        avatarImage.imageProperty().bind(viewModel.reporterProperty().avatarProperty());
    }


    public void setReporter(ReadOnlyReporterProperty reporter) {
        viewModel.setReporter(reporter);
    }
}

