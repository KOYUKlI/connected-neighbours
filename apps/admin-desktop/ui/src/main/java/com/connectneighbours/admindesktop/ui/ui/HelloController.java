package com.connectneighbours.admindesktop.ui.ui;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.IncidentMapper;
import com.connectneighbours.admindesktop.back.application.incident.IncidentSyncDTO;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;
import com.connectneighbours.admindesktop.back.application.sync.SyncManagement;
import com.connectneighbours.admindesktop.back.application.sync.SyncPullResponseDTO;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.alert.controller.AlertViewController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.controller.IncidentTableController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.ReadOnlyIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.SimpleIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.viewmodel.IncidentTableViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
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
    private SyncManagement syncManagement;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private AlertManagement alertManagement;

    @Autowired
    private StatisticsManagement statisticsManagement;

    private IncidentTableController tableController;

    @FXML
    private Label welcomeText;

    @FXML
    private VBox mainContainer;

    @FXML
    public void initialize() {
        homeContent = new ArrayList<>(mainContainer.getChildren());

        var page = incidentManagement.listIncidents(PageRequest.of(0, 10));
        var incidents = page.getContent();
        if (incidents.isEmpty()) return;

        try {
            IncidentTableController tableController = new IncidentTableController();
            tableController.setParent(this);


            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource("/com/connectneighbours/admindesktop/ui/ui/features/incident/incidenttable/view/incident-table-view.fxml")
            );

            loader.setRoot(tableController);
            loader.setController(tableController);

            loader.load();


            List<IncidentTableViewModel> models = incidents.stream()
                    .map(dto -> {
                        var newDto = incidentManagement.startIncidentProgress(dto.id());
                        System.out.println(newDto);
                        var vm = new IncidentTableViewModel();
                        vm.setDto(newDto);
                        vm.setIncidentTable(mapToProperty(newDto));
                        return vm;
                    })
                    .toList();


            tableController.getIncidentTable().getItems().setAll(models);


            mainContainer.getChildren().setAll(tableController);
            homeContent = new ArrayList<>(mainContainer.getChildren());
        } catch (IOException e) {
            throw new RuntimeException("Erreur chargement incident-table-view.fxml", e);
        }
    }


    @FXML
    protected void onHelloButtonClick() {
        welcomeText.setText("Welcome to JavaFX Application!");
    }


//    @FXML
//    private void onSyncClicked() {
//        SyncPullResponseDTO response = syncManagement.pull("desktop-1", null);
//
//        var models = response.incidents().stream()
//                .map(sync -> {
//                    var dto = IncidentMapper.fromSyncDTO(sync);
//                    var vm = new IncidentTableViewModel();
//                    vm.setDto(dto);
//                    vm.setIncidentTable(mapToProperty(dto));
//                    return vm;
//                })
//                .toList();
//
//        tableController.getIncidentTable().getItems().setAll(models);
//    }




    @FXML
    public void goToAlerts(IncidentDTO incident) {
        AlertViewController alertView = new AlertViewController();
        alertView.setParent(this);
        alertView.loadIncident(incident);
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

    public StatisticsManagement getStatisticsManagement() {
        return statisticsManagement;
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

}


