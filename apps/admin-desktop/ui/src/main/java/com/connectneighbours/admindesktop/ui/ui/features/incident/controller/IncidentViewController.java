package com.connectneighbours.admindesktop.ui.ui.features.incident.controller;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.application.statistics.IncidentDistributionByTypeDTO;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.controller.AlertViewController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.controller.IncidentDistributionByTypeController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model.IncidentDistributionByTypeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model.SimpleIncidentDistributionByTypeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.viewmodel.IncidentDistributionByTypeViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.controller.IncidentTableController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.ReadOnlyIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.SimpleIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.viewmodel.IncidentTableViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.image.Image;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.List;

public class IncidentViewController extends VBox {
    @FXML
    private HBox graphIncident;
    private AdminDesktopController parent;

    private IncidentTableController tableController;

    @FXML
    private VBox container;

    public IncidentViewController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/incident/view/incident-view.fxml"
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
        tableController = new IncidentTableController();
        tableController.setParent(this);

        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/incident/incidenttable/view/incident-table-view.fxml"
        ));
        loader.setRoot(tableController);
        loader.setController(tableController);

        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        container.getChildren().setAll(tableController);
    }

    public void goToAlerts(IncidentDTO incident) {
        AlertViewController alertView = new AlertViewController();
        alertView.setParent(this);
        alertView.loadIncident(incident);
        parent.getMainContainer().getChildren().setAll(alertView);
    }

    public void loadIncidents(List<IncidentDTO> incidents) {
        List<IncidentTableViewModel> models = incidents.stream()
                .map(dto -> {
                    var newDto = getIncidentManagement().startIncidentProgress(dto.id());
                    var vm = new IncidentTableViewModel();
                    vm.setDto(newDto);
                    vm.setIncidentTable(mapToProperty(newDto));
                    return vm;
                })
                .toList();

        tableController.getIncidentTable().getItems().setAll(models);
        var distributionList = getStatisticsManagement().listIncidentDistributedByType();

        List<IncidentDistributionByTypeProperty> properties = distributionList.stream()
                .map(this::toIncidentDistributionByTypeProperty)
                .toList();

        loadIncidentDistribution(properties);
    }

    public void loadIncidentDistribution(List<IncidentDistributionByTypeProperty> list) {
        graphIncident.getChildren().clear();

        IncidentDistributionByTypeController distribution = new IncidentDistributionByTypeController();
        distribution.setPrefWidth(250);
        distribution.setMaxWidth(250);

        List<IncidentDistributionByTypeViewModel> viewModelList = list.stream()
                .map(distribution::toIncidentDistributionByTypeViewModel)
                .toList();

        distribution.bindGraph(viewModelList);

        graphIncident.getChildren().add(distribution);
    }


    private ReadOnlyIncidentTableProperty mapToProperty(IncidentDTO dto) {
        SimpleIncidentTableProperty p = new SimpleIncidentTableProperty();
        p.incidentIdProperty().set(dto.displayId());
        p.titleProperty().set(dto.title());
        p.typeProperty().set(dto.type().toString());
        p.statusProperty().set(dto.status().toString());
        p.createdAtProperty().set(dto.createdAt());
        p.resolvedAtProperty().set(dto.resolvedAt());
        p.alertsCountProperty().set(dto.alerts().size());
        p.reporterProperty().set((ReporterProperty) mapReporter(dto.reporter()));
        p.severityProperty().set(dto.severity().toString());
        return p;
    }

    private ReadOnlyReporterProperty mapReporter(ReporterDTO dto) {
        SimpleReporterProperty p = new SimpleReporterProperty();
        p.firstnameProperty().set(dto.firstname());
        p.lastnameProperty().set(dto.lastname());
        p.avatarProperty().set(new Image(dto.avatarPath()));
        return p;
    }


    private IncidentDistributionByTypeProperty toIncidentDistributionByTypeProperty(IncidentDistributionByTypeDTO dto) {
        SimpleIncidentDistributionByTypeProperty p = new SimpleIncidentDistributionByTypeProperty();
        p.countProperty().set(dto.count());
        p.rateProperty().set(dto.rate());
        p.percentageProperty().set(dto.percentage());
        p.typeProperty().set(dto.type());
        return p;
    }


    public AlertManagement getAlertManagement() {
        return parent.getAlertManagement();
    }

    public StatisticsManagement getStatisticsManagement() {
        return parent.getStatisticsManagement();
    }

    public IncidentManagement getIncidentManagement() {
        return parent.getIncidentManagement();
    }

    public void goBackToIncidents() {
        parent.showHome();
    }

    public void setParent(AdminDesktopController parent) {
        this.parent = parent;
    }
}

