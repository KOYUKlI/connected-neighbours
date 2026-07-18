package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.controller;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model.ReadOnlyIncidentDistributionByTypeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.viewmodel.IncidentDistributionByTypeViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.utils.IncidentFormatting;
import javafx.beans.binding.Bindings;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Group;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.paint.Paint;
import javafx.scene.shape.Arc;
import javafx.scene.shape.ArcType;

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

    public void bindGraph(List<IncidentDistributionByTypeViewModel> list) {
        graphDistribution.getChildren().clear();

        double start = 0;

        for (IncidentDistributionByTypeViewModel vm : list) {

            var p = vm.distributionProperty();

            Arc arc = new Arc();
            arc.setCenterX(110);
            arc.setCenterY(110);
            arc.setRadiusX(80);
            arc.setRadiusY(80);
            arc.setStroke(Color.WHITE);
            arc.setStrokeWidth(2);
            arc.setType(ArcType.ROUND);


            double fixedStart = start;
            arc.startAngleProperty().set(fixedStart);

            arc.lengthProperty().bind(p.rateProperty().multiply(360));

            arc.fillProperty().bind(
                    Bindings.createObjectBinding(
                            () -> colorFor(p.typeProperty().get()),
                            p.typeProperty()
                    )
            );

            graphDistribution.getChildren().add(arc);

            start += p.rateProperty().get() * 360;
        }
    }

    private Paint colorFor(IncidentType type) {
        return Color.web(IncidentFormatting.colorHex(type));
    }

    public IncidentDistributionByTypeViewModel toIncidentDistributionByTypeViewModel(ReadOnlyIncidentDistributionByTypeProperty property) {
        IncidentDistributionByTypeViewModel vm = new IncidentDistributionByTypeViewModel();
        vm.setDistribution(property);
        return vm;
    }
}
