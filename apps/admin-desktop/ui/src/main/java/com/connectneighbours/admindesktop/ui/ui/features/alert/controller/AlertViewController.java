package com.connectneighbours.admindesktop.ui.ui.features.alert.controller;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.application.statistics.AlertDistributionBySeverityDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.controller.AlertDistributionByGravityController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.AlertDistributionByGravityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.model.SimpleAlertDistributionByGravityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertdistributiongravity.viewmodel.AlertDistributionByGravityViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.controller.AlertStatsController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model.AlertStatsProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.alertstats.model.SimpleAlertStatsProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.controller.WidgetAlertController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model.SimpleWidgetAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model.WidgetAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.controller.IncidentViewController;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuItem;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

public class AlertViewController extends VBox {

    private static final Logger log = LoggerFactory.getLogger(AlertViewController.class);
    private IncidentViewController parent;
    private IncidentDTO currentIncident;

    private String selectedGravity = "Toutes";
    private String selectedStatus = "Tous";
    private String selectedDate = "Toutes";

    @FXML
    private VBox alertStatsContainer;
    @FXML
    private HBox alertDistribution;

    @FXML
    private Label titleIncident;

    @FXML
    private VBox alertsContainer;
    @FXML
    private Button btnReturn;
    @FXML
    private Button btnFilter;

    @FXML
    private Label gravityValue;
    @FXML
    private Label statusValue;
    @FXML
    private Label dateValue;

    @FXML
    private HBox menuBtn;
    @FXML
    private Menu menuGravity;
    @FXML
    private MenuItem gravityAll;
    @FXML
    private MenuItem gravityCritical;
    @FXML
    private MenuItem gravityHigh;
    @FXML
    private MenuItem gravityMedium;
    @FXML
    private MenuItem gravityLow;

    @FXML
    private Menu menuStatus;
    @FXML
    private MenuItem statusAll;
    @FXML
    private MenuItem statusResolved;
    @FXML
    private MenuItem statusInProgress;
    @FXML
    private MenuItem statusClosed;

    @FXML
    private Menu menuDate;
    @FXML
    private MenuItem dateAll;
    @FXML
    private MenuItem dateToday;
    @FXML
    private MenuItem dateWeek;
    @FXML
    private MenuItem dateMonth;

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


    public void setParent(IncidentViewController parent) {
        this.parent = parent;
    }

    public void loadIncident(IncidentDTO incident) {
        titleIncident.textProperty().set("Incident #" + incident.displayId() + " - " + incident.title());
        alertsContainer.getChildren().clear();
        var distributionList = parent.getStatisticsManagement().listAlertDistributionBySeverityAndIncident(incident);
        for (AlertDTO alert : incident.alerts()) {
            var newAlertDto = parent.getAlertManagement().startAlertProgress(alert.id());
            WidgetAlertController widget = new WidgetAlertController();
            widget.setAlert(toWidgetProperty(newAlertDto));
            alertsContainer.getChildren().add(widget);
        }
        loadStats(incident);


        List<AlertDistributionByGravityProperty> list = distributionList.stream()
                .map(this::toAlertDistributionByGravityProperty)
                .toList();

        loadDistribution(list);
    }

    public void loadStats(IncidentDTO incident) {
        alertStatsContainer.getChildren().clear();
        AlertStatsController stats = new AlertStatsController();
        stats.setAlertStats(toAlertStatsProperty(incident));
        alertStatsContainer.getChildren().addFirst(stats);
        alertStatsContainer.getChildren().add(menuBtn);
    }

    public void loadDistribution(List<AlertDistributionByGravityProperty> list) {
        AlertDistributionByGravityController distribution = new AlertDistributionByGravityController();
        distribution.setPrefWidth(250);
        distribution.setMaxWidth(250);
        HBox.setHgrow(distribution, Priority.NEVER);

        List<AlertDistributionByGravityViewModel> viewModelList = list.stream()
                .map(distribution::toAlertDistributionByGravityViewModel)
                .toList();

        distribution.bindGraph(viewModelList);

        alertDistribution.getChildren().addFirst(distribution);
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

    private AlertDistributionByGravityProperty toAlertDistributionByGravityProperty(AlertDistributionBySeverityDTO dto) {
        SimpleAlertDistributionByGravityProperty p = new SimpleAlertDistributionByGravityProperty();
        p.countProperty().set(dto.count());
        p.rateProperty().set(dto.rate());
        p.percentageProperty().set(dto.percentage());
        p.severityProperty().set(dto.severity());
        return p;
    }

    @FXML
    private void initialize() {

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

        return switch (selectedDate) {
            case "Aujourd’hui" -> created.isEqual(now);
            case "Cette semaine" -> created.isAfter(now.minusDays(7));
            case "Ce mois" -> created.getMonth() == now.getMonth() && created.getYear() == now.getYear();
            default -> true;
        };
    }

    @FXML
    protected void goToIncident() {
        if (parent != null) parent.goBackToIncidents();
    }
}

