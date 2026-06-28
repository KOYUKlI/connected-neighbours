package com.connectneighbours.admindesktop.ui.ui;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.alert.controller.AlertViewController;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@Scope("prototype")
public class HelloController {

    private AlertViewController alertView;
    private List<Node> homeContent;

    @Autowired
    private IncidentManagement incidentManagement;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private AlertManagement alertManagement;

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
    public void goToAlerts() {

        var page = incidentManagement.listIncidents(PageRequest.of(0, 10));
        var incidents = page.getContent();

        if (incidents.isEmpty()) return;

        IncidentDTO firstIncident = incidents.getFirst();

        AlertViewController alertView = new AlertViewController();

        alertView.setParent(this);
        alertView.loadIncident(firstIncident);
        mainContainer.getChildren().setAll(alertView);
    }

    public void showHome() {
        mainContainer.getChildren().setAll(homeContent);
    }

    public IncidentManagement getIncidentManagement() {
        return incidentManagement;
    }

    public AlertManagement getAlertManagement() {
        return alertManagement;
    }
}


