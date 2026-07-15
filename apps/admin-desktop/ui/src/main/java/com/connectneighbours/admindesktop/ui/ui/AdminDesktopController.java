package com.connectneighbours.admindesktop.ui.ui;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;
import com.connectneighbours.admindesktop.back.application.theme.ThemeDTO;
import com.connectneighbours.admindesktop.back.application.theme.ThemeManagement;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.PluginManagement;
import com.connectneighbours.admindesktop.back.infrastructure.theme.ThemeContext;
import com.connectneighbours.admindesktop.ui.ui.features.incident.controller.IncidentViewController;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.controller.PluginViewController;
import com.connectneighbours.admindesktop.ui.ui.features.theme.controller.ThemeViewController;
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
    private ThemeManagement themeManagement;

    @Autowired
    private ThemeContext themeContext;

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
    private MenuItem navThemes;

    @FXML
    public void initialize() {
        homeContent = new ArrayList<>(mainContainer.getChildren());

        navIncidents.setOnAction(e -> showIncidents());
        navPlugins.setOnAction(e -> showPlugins());
        navThemes.setOnAction(e -> showThemes());

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

    public void showThemes() {
        ThemeViewController themeView = new ThemeViewController();
        themeView.setParent(this);
        themeView.loadThemes(themeManagement.listThemes());

        mainContainer.getChildren().setAll(themeView);
    }

    public void showHome() {
        showIncidents();
    }

    public void applyTheme(ThemeDTO dto) {
        themeContext.setActiveTheme(dto);

        var root = mainContainer.getScene().getRoot();
        root.setStyle(String.format(
                "-app-primary: rgb(%d,%d,%d);",
                dto.rgb().red(), dto.rgb().green(), dto.rgb().blue()
        ));
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

    public ThemeManagement getThemeManagement() {
        return themeManagement;
    }

    public ThemeContext getThemeContext() {
        return themeContext;
    }
}
