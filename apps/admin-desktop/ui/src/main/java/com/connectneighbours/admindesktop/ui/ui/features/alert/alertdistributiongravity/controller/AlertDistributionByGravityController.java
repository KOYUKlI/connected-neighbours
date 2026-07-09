package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.controller;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.ReadOnlyAlertDistributionByGravityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.viewmodel.AlertDistributionByGravityViewModel;
import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Group;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.paint.Paint;
import javafx.scene.shape.Arc;
import javafx.scene.shape.ArcType;
import javafx.scene.shape.Circle;

import java.io.IOException;
import java.util.List;

public class AlertDistributionByGravityController extends VBox {

    @FXML
    private Group graphDistribution;

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
    public void initialize() {
    }

    public void bindGraph(List<AlertDistributionByGravityViewModel> list) {
        graphDistribution.getChildren().clear();

        double start = 0;

        for (AlertDistributionByGravityViewModel vm : list) {

            var p = vm.alertDistributionByGravityProperty();

            Arc arc = new Arc();
            arc.setCenterX(110);
            arc.setCenterY(110);
            arc.setRadiusX(80);
            arc.setRadiusY(80);
            arc.setStroke(Color.WHITE);
            arc.setType(ArcType.ROUND);

            double fixedStart = start;
            arc.startAngleProperty().set(fixedStart);

            arc.lengthProperty().bind(p.rateProperty().multiply(360));

            arc.fillProperty().bind(
                    Bindings.createObjectBinding(
                            () -> colorFor(p.severityProperty().get()),
                            p.severityProperty()
                    )
            );

            graphDistribution.getChildren().add(arc);

            start += p.rateProperty().get() * 360;
        }

        Circle hole = new Circle(110, 110, 30, Color.WHITE);
        graphDistribution.getChildren().add(hole);
    }

    private Paint colorFor(AlertSeverity severity) {
        return switch (severity) {
            case CRITICAL -> Color.web("#F03B3D");
            case HIGH     -> Color.web("#2E6BE6");
            case MEDIUM   -> Color.web("#FAB303");
            case LOW      -> Color.web("#3AA835");
        };
    }

    public AlertDistributionByGravityViewModel toAlertDistributionByGravityViewModel(ReadOnlyAlertDistributionByGravityProperty property) {
        AlertDistributionByGravityViewModel vm = new AlertDistributionByGravityViewModel();
        vm.setDistribution(property);
        return vm;
    }
}


