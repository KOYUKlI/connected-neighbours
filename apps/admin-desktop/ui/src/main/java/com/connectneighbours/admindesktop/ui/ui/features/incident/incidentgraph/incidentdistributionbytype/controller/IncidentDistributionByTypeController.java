package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.controller;

import com.connectneighbours.admindesktop.back.application.statistics.AlertDistributionBySeverityDTO;
import com.connectneighbours.admindesktop.back.application.statistics.IncidentDistributionByTypeDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
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

public class IncidentDistributionByTypeController extends VBox {

    @FXML
    private Group graphDistribution;

    public IncidentDistributionByTypeController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/incident/incidentgraph/incidentdistributionbytype/view/incident-distribution-type-view.fxml"
        ));
        loader.setRoot(this);
        loader.setController(this);
        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public void updateGraph(List<IncidentDistributionByTypeDTO> dtoList) {
        graphDistribution.getChildren().clear();

        if (dtoList.isEmpty()) {
            Circle hole = new Circle(110, 110, 30, Color.WHITE);
            graphDistribution.getChildren().add(hole);
            return;
        }

        boolean single = dtoList.size() == 1;
        double start = 0;

        for (IncidentDistributionByTypeDTO dto : dtoList) {
            double length = single ? 360 : dto.rate() * 360;
            Arc arc = new Arc();
            arc.setCenterX(110);
            arc.setCenterY(110);
            arc.setRadiusX(80);
            arc.setRadiusY(80);
            arc.setStartAngle(start);
            arc.setLength(length);
            arc.setType(ArcType.ROUND);
            arc.setFill(colorFor(dto.type()));
            graphDistribution.getChildren().add(arc);
            start += length;
        }

        Circle hole = new Circle(110, 110, 30, Color.WHITE);
        graphDistribution.getChildren().add(hole);
    }

    private Paint colorFor(IncidentType type) {
        return switch (type) {
            case SECURITY -> Color.web("#0098C8");
            case NUISANCE     -> Color.web("#FA9D03");
            case CLEANLINESS   -> Color.web("#30AB41");
            case MAINTENANCE      -> Color.web("#EA5F3B");
            case TRAFFIC      -> Color.web("#7831A7");
            case OTHER      -> Color.web("#4357D1");
        };
    }
}
