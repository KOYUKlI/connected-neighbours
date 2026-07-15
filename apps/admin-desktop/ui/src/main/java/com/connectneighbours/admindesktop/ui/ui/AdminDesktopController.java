package com.connectneighbours.admindesktop.ui.ui;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.PluginManagement;
import com.connectneighbours.admindesktop.ui.ui.features.incident.controller.IncidentViewController;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.controller.PluginViewController;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.MenuItem;
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
    private ReporterManagement reporterManagement;

    @Autowired
    private PluginManagement pluginManagement;

    @Autowired
    private ApplicationContext context;

    private List<Node> homeContent;

    @FXML
    private VBox mainContainer;

    @FXML
    private MenuItem navIncidents;

    @FXML
    private MenuItem navPlugins;

    @FXML
    public void initialize() {
        homeContent = new ArrayList<>(mainContainer.getChildren());

        navIncidents.setOnAction(e -> showIncidents());
        navPlugins.setOnAction(e -> showPlugins());

        showIncidents();
    }

    public void showIncidents() {
        var page = incidentManagement.listIncidents(PageRequest.of(0, 10));
        if (page.getContent().isEmpty()) {
            mainContainer.getChildren().setAll(homeContent);
            return;
        }

        IncidentViewController incidentView = new IncidentViewController();
        incidentView.setParent(this);
        incidentView.loadIncidents(page);

        mainContainer.getChildren().setAll(incidentView);
    }

    public void showPlugins() {
        PluginViewController pluginView = new PluginViewController();
        pluginView.setParent(this);
        pluginView.loadPlugins(pluginManagement.listPlugins());

        mainContainer.getChildren().setAll(pluginView);
    }

    public void showHome() {
        showIncidents();
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

    public ReporterManagement getReporterManagement() {
        return reporterManagement;
    }

    public PluginManagement getPluginManagement() {
        return pluginManagement;
    }
}
