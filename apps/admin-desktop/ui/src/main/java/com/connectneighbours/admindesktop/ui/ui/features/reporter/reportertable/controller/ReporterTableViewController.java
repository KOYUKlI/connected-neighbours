package com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.controller;

import com.connectneighbours.admindesktop.back.application.statistics.ReporterActivityDTO;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRole;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.model.SimpleReporterActivityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.viewmodel.ReporterActivityViewModel;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.List;

public class ReporterTableViewController extends VBox {
    private AdminDesktopController parent;

    @FXML
    private Button btnRefresh;
    @FXML
    private TableView<ReporterActivityViewModel> reporterTable;
    @FXML
    private TableColumn<ReporterActivityViewModel, String> nameColumn;
    @FXML
    private TableColumn<ReporterActivityViewModel, String> roleColumn;
    @FXML
    private TableColumn<ReporterActivityViewModel, Number> incidentCountColumn;
    @FXML
    private TableColumn<ReporterActivityViewModel, Number> alertCountColumn;

    public ReporterTableViewController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/reporter/reportertable/view/reporter-table-view.fxml"
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
    private void initialize() {
        nameColumn.setCellValueFactory(data -> data.getValue().reporterActivityProperty().fullNameProperty());
        roleColumn.setCellValueFactory(data -> data.getValue().reporterActivityProperty().roleProperty());
        incidentCountColumn.setCellValueFactory(data -> data.getValue().reporterActivityProperty().incidentCountProperty());
        alertCountColumn.setCellValueFactory(data -> data.getValue().reporterActivityProperty().alertCountProperty());

        reporterTable.setItems(FXCollections.observableArrayList());

        btnRefresh.setOnAction(e -> refresh());
    }

    public void setParent(AdminDesktopController parent) {
        this.parent = parent;
    }

    public void loadReporters(List<ReporterActivityDTO> reporters) {
        List<ReporterActivityViewModel> models = reporters.stream()
                .map(dto -> {
                    var vm = new ReporterActivityViewModel();
                    vm.setDto(dto);
                    vm.setReporterActivity(toProperty(dto));
                    return vm;
                })
                .toList();

        reporterTable.setItems(FXCollections.observableArrayList(models));
    }

    public void refresh() {
        loadReporters(parent.getStatisticsManagement().reporterActivity());
    }

    private SimpleReporterActivityProperty toProperty(ReporterActivityDTO dto) {
        var property = new SimpleReporterActivityProperty();
        property.fullNameProperty().set(dto.firstname() + " " + dto.lastname());
        property.roleProperty().set(formatRole(dto.role()));
        property.incidentCountProperty().set(dto.incidentCount().intValue());
        property.alertCountProperty().set(dto.alertCount().intValue());
        return property;
    }

    private String formatRole(ReporterRole role) {
        return switch (role) {
            case RESIDENT -> "Résident";
            case MODERATOR -> "Modérateur";
            case ADMIN -> "Administrateur";
        };
    }
}
