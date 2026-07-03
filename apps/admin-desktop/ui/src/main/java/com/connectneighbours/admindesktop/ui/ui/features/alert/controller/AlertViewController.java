package com.connectneighbours.admindesktop.ui.ui.features.alert.controller;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.HelloController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.controller.AlertDistributionByGravityController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.controller.AlertStatsController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model.AlertStatsProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model.SimpleAlertStatsProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.controller.WidgetAlertController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model.SimpleWidgetAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model.WidgetAlertProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.time.LocalDate;

public class AlertViewController extends VBox {

    private HelloController parent;
    private IncidentDTO currentIncident;

    private String selectedGravity = "Toutes";
    private String selectedStatus = "Tous";
    private String selectedDate = "Toutes";

    @FXML private VBox alertStatsContainer;
    @FXML private HBox alertDistribution;

    @FXML private Label titleIncident;

    @FXML private VBox alertsContainer;
    @FXML private Button btnReturn;
    @FXML private Button btnFilter;

    @FXML private Label gravityValue;
    @FXML private Label statusValue;
    @FXML private Label dateValue;

    @FXML private HBox menuBtn;
    @FXML private Menu menuGravity;
    @FXML private MenuItem gravityAll;
    @FXML private MenuItem gravityCritical;
    @FXML private MenuItem gravityHigh;
    @FXML private MenuItem gravityMedium;
    @FXML private MenuItem gravityLow;

    @FXML private Menu menuStatus;
    @FXML private MenuItem statusAll;
    @FXML private MenuItem statusResolved;
    @FXML private MenuItem statusInProgress;
    @FXML private MenuItem statusClosed;

    @FXML private Menu menuDate;
    @FXML private MenuItem dateAll;
    @FXML private MenuItem dateToday;
    @FXML private MenuItem dateWeek;
    @FXML private MenuItem dateMonth;

    public AlertViewController() {
        FXMLLoader loader = new FXMLLoader(
                getClass().getResource(
                        "/com/connectneighbours/admindesktop/ui/ui/features/alert/view/alert-view.fxml"
                )
        );

        loader.setRoot(this);
        loader.setController(this);

        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException("Erreur chargement alert-view.fxml", e);
        }
    }


    public void setParent(HelloController parent) {
        this.parent = parent;
    }

    public void loadIncident(IncidentDTO incident) {
        titleIncident.textProperty().set("Incident #" + incident.displayId() + " - " + incident.title());
        alertsContainer.getChildren().clear();

        for (AlertDTO alert : incident.alerts()) {
            var newAlertDto = parent.getAlertManagement().startAlertProgress(alert.id());
            WidgetAlertController widget = new WidgetAlertController();
            widget.setAlert(toWidgetProperty(newAlertDto));
            alertsContainer.getChildren().add(widget);
        }
        loadStats(incident);
    }

    public void loadStats(IncidentDTO incident) {
        alertStatsContainer.getChildren().clear();
        AlertStatsController stats = new AlertStatsController();
        stats.setAlertStats(toAlertStatsProperty(incident));
        alertStatsContainer.getChildren().addFirst(stats);
        alertStatsContainer.getChildren().add(menuBtn);
    }

    private WidgetAlertProperty toWidgetProperty(AlertDTO dto) {
        SimpleWidgetAlertProperty p = new SimpleWidgetAlertProperty();
        p.titleProperty().set(dto.title());
        p.detailsProperty().set(dto.details());
        p.statusProperty().set(dto.status().toString());
        p.severityProperty().set(dto.severity().toString());
        p.reporterNameProperty().set(dto.reporter().firstname() + " " + dto.reporter().lastname());
        p.reporterProperty().set(dto.reporter());
        p.createdAtProperty().set(dto.createdAt());
        p.resolvedAtProperty().set(dto.resolvedAt());
        return p;
    }

    private AlertStatsProperty toAlertStatsProperty(IncidentDTO dto) {
        SimpleAlertStatsProperty p = new SimpleAlertStatsProperty();
        p.totalAlertsProperty().set(parent.getAlertManagement().listByIncident(dto).size());
        p.totalAlertsCriticalProperty().set(parent.getAlertManagement().listByIncidentAndSeverity(dto, AlertSeverity.CRITICAL).size());
        p.averageResolutionTimeProperty().set(0);
        return p;
    }

    @FXML
    private void initialize() {
        AlertDistributionByGravityController distribution = new AlertDistributionByGravityController();
        alertDistribution.getChildren().addFirst(distribution);

        btnReturn.setOnAction(e -> goToIncident());
        btnFilter.setOnAction(e -> refreshFilter());


        bindMenuItem(gravityAll, gravityValue);
        bindMenuItem(gravityCritical, gravityValue);
        bindMenuItem(gravityHigh, gravityValue);
        bindMenuItem(gravityMedium, gravityValue);
        bindMenuItem(gravityLow, gravityValue);

        bindMenuItem(statusAll, statusValue);
        bindMenuItem(statusResolved, statusValue);
        bindMenuItem(statusInProgress, statusValue);
        bindMenuItem(statusClosed, statusValue);

        bindMenuItem(dateAll, dateValue);
        bindMenuItem(dateToday, dateValue);
        bindMenuItem(dateWeek, dateValue);
        bindMenuItem(dateMonth, dateValue);
    }

    private void bindMenuItem(MenuItem item, Label target) {
        item.setOnAction(e -> target.setText(item.getText()));
    }

    private void refreshFilter() {
        if (currentIncident == null) return;

        alertsContainer.getChildren().clear();

        for (AlertDTO alert : currentIncident.alerts()) {

            boolean matchGravity = selectedGravity.equals("Toutes")
                    || alert.severity().toString().equalsIgnoreCase(selectedGravity);

            boolean matchStatus = selectedStatus.equals("Tous")
                    || alert.status().toString().equalsIgnoreCase(selectedStatus);

            boolean matchDate = selectedDate.equals("Toutes")
                    || matchDateFilter(alert);

            if (matchGravity && matchStatus && matchDate) {
                WidgetAlertController widget = new WidgetAlertController();
                widget.setAlert(toWidgetProperty(alert));
                alertsContainer.getChildren().add(widget);
            }
        }
    }


    private boolean matchDateFilter(AlertDTO alert) {
        LocalDate created = alert.createdAt().toLocalDate();
        LocalDate now = LocalDate.now();

        switch (selectedDate) {
            case "Aujourd’hui":
                return created.isEqual(now);
            case "Cette semaine":
                return created.isAfter(now.minusDays(7));
            case "Ce mois":
                return created.getMonth() == now.getMonth() && created.getYear() == now.getYear();
            default:
                return true;
        }
    }

    @FXML
    protected void goToIncident() {
        if (parent != null) parent.showHome();
    }
}

