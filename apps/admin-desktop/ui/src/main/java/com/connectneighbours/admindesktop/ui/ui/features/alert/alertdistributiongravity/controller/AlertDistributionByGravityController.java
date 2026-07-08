package com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.controller;

import com.connectneighbours.admindesktop.back.application.statistics.AlertDistributionBySeverityDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.ReadOnlyAlertDistributionByGravityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.viewmodel.AlertDistributionByGravityViewModel;
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

    public void updateGraph(List<AlertDistributionBySeverityDTO> dtoList) {
        graphDistribution.getChildren().clear();

        if (dtoList.isEmpty()) {
            Circle hole = new Circle(110, 110, 30, Color.WHITE);
            graphDistribution.getChildren().add(hole);
            return;
        }

        boolean single = dtoList.size() == 1;
        double start = 0;

        for (AlertDistributionBySeverityDTO dto : dtoList) {
            double length = single ? 360 : dto.rate() * 360;
            Arc arc = new Arc();
            arc.setCenterX(110);
            arc.setCenterY(110);
            arc.setRadiusX(80);
            arc.setRadiusY(80);
            arc.setStartAngle(start);
            arc.setLength(length);
            arc.setType(ArcType.ROUND);
            arc.setFill(colorFor(dto.severity()));
            graphDistribution.getChildren().add(arc);
            start += length;
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
}
