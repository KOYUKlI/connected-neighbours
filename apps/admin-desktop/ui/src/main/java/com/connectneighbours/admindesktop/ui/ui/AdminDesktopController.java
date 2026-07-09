package com.connectneighbours.admindesktop.ui.ui;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;
import com.connectneighbours.admindesktop.ui.ui.features.incident.controller.IncidentViewController;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.layout.VBox;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Scope("prototype")
public class AdminDesktopController {

    @Autowired
    private IncidentManagement incidentManagement;

    @Autowired
    private AlertManagement alertManagement;

    @Autowired
    private StatisticsManagement statisticsManagement;

    @Autowired
    private ApplicationContext context;

    private List<Node> homeContent;

    @FXML
    private VBox mainContainer;

    @FXML
    public void initialize() {
        homeContent = new ArrayList<>(mainContainer.getChildren());

        var page = incidentManagement.listIncidents(PageRequest.of(0, 10));
        var incidents = page.getContent();
        if (incidents.isEmpty()) return;

        IncidentViewController incidentView = new IncidentViewController();
        incidentView.setParent(this);
        incidentView.loadIncidents(incidents);

        mainContainer.getChildren().setAll(incidentView);
        homeContent = new ArrayList<>(mainContainer.getChildren());
    }


    public void showHome() {
        mainContainer.getChildren().setAll(homeContent);
    }

    public VBox getMainContainer() {
        return mainContainer;
    }

    public IncidentManagement getIncidentManagement() {
        return incidentManagement;
    }

    public AlertManagement getAlertManagement() {
        return alertManagement;
    }

    public StatisticsManagement getStatisticsManagement() {
        return statisticsManagement;
    }
}



