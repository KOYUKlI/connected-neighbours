package com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.controller;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.ui.ui.HelloController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.viewmodel.IncidentTableViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.utils.IncidentFormatting;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class IncidentTableController extends VBox {
    private HelloController parent;

    @FXML
    private TableView<IncidentTableViewModel> incidentTable;
    @FXML
    private TableColumn<IncidentTableViewModel, String> idColumn;
    @FXML
    private TableColumn<IncidentTableViewModel, String> titleColumn;
    @FXML
    private TableColumn<IncidentTableViewModel, String> typeColumn;
    @FXML
    private TableColumn<IncidentTableViewModel, String> statusColumn;
    @FXML
    private TableColumn<IncidentTableViewModel,String> severityColumn;
    @FXML
    private TableColumn<IncidentTableViewModel, ReporterProperty> reporterColumn;
    @FXML
    private TableColumn<IncidentTableViewModel, LocalDate> createdAtColumn;
    @FXML
    private TableColumn<IncidentTableViewModel, LocalDate> resolvedAtColumn;
    @FXML
    private TableColumn<IncidentTableViewModel, Number> alertsColumn;

    @FXML
    private void initialize() {
        idColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().incidentIdProperty());
        titleColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().titleProperty());
        typeColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().typeProperty());
        statusColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().statusProperty());
        severityColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().severityProperty());
        reporterColumn.setCellValueFactory(data -> new SimpleObjectProperty<>((ReporterProperty) data.getValue().incidentTableProperty().reporterProperty()));
        createdAtColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().createdAtProperty().map(LocalDateTime::toLocalDate));
        resolvedAtColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().resolvedAtProperty().map(LocalDateTime::toLocalDate));
        alertsColumn.setCellValueFactory(data -> data.getValue().incidentTableProperty().alertsCountProperty());

        ObservableList<IncidentTableViewModel> data = FXCollections.observableArrayList();
        incidentTable.setItems(data);

        incidentTable.setRowFactory(tv -> {
            TableRow<IncidentTableViewModel> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (!row.isEmpty() && event.getClickCount() == 2) {
                    IncidentTableViewModel vm = row.getItem();
                    IncidentDTO dto = vm.getDto();
                    parent.goToAlerts(dto);
                }
            });
            return row;
        });

        typeColumn.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String status, boolean empty) {
                super.updateItem(status, empty);
                if (empty || status == null) {
                    setText(null);
                    setGraphic(null);
                    return;
                }

                Label badge = new Label(IncidentFormatting.format(status));
                badge.setPadding(new Insets(4, 10, 4, 10));

                setGraphic(badge);
                setText(null);
                setAlignment(Pos.CENTER);

            }
        });

        statusColumn.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String status, boolean empty) {
                super.updateItem(status, empty);
                if (empty || status == null) {
                    setText(null);
                    setGraphic(null);
                    return;
                }

                Label badge = new Label(IncidentFormatting.format(status));
                badge.setPadding(new Insets(4, 10, 4, 10));

                String style = getString(status);

                badge.setStyle(style);
                setGraphic(badge);
                setText(null);
                setAlignment(Pos.CENTER);

            }
        });
    }

    public TableView<IncidentTableViewModel> getIncidentTable() {
        return incidentTable;
    }

    public void setParent(HelloController parent) {
        this.parent = parent;
    }

    private static String getString(String status) {
        String formatted = IncidentFormatting.format(status).trim().toLowerCase();

        return switch (formatted) {
            case "résolu" -> "-fx-background-color:#1F9338;-fx-text-fill:white;-fx-background-radius:12;";
            case "en cours" -> "-fx-background-color:#EA7F0F;-fx-text-fill:white;-fx-background-radius:12;";
            case "ouvert" -> "-fx-background-color:#3B82F6;-fx-text-fill:white;-fx-background-radius:12;";
            default -> "-fx-background-color:#253DB3;-fx-text-fill:white;-fx-background-radius:12;";
        };
    }
}
