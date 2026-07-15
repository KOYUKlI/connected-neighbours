package com.connectneighbours.admindesktop.ui.ui.features.sync.controller;

import com.connectneighbours.admindesktop.back.application.sync.SyncHistoryDTO;
import com.connectneighbours.admindesktop.back.application.sync.SyncStatusDTO;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class SyncHistoryViewController extends VBox {
    private static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss").withZone(ZoneId.systemDefault());

    private AdminDesktopController parent;

    @FXML
    private Button btnRefresh;
    @FXML
    private Label lastPushLabel;
    @FXML
    private Label lastPullLabel;
    @FXML
    private Label pendingOperationsLabel;
    @FXML
    private TableView<SyncHistoryDTO> historyTable;
    @FXML
    private TableColumn<SyncHistoryDTO, String> typeColumn;
    @FXML
    private TableColumn<SyncHistoryDTO, String> timestampColumn;
    @FXML
    private TableColumn<SyncHistoryDTO, Number> countColumn;

    public SyncHistoryViewController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/sync/view/sync-history-view.fxml"
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
        typeColumn.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().type()));
        timestampColumn.setCellValueFactory(data -> new SimpleStringProperty(formatTimestamp(data.getValue().timestamp())));
        countColumn.setCellValueFactory(data -> new SimpleIntegerProperty(data.getValue().count()));

        historyTable.setItems(FXCollections.observableArrayList());

        btnRefresh.setOnAction(e -> refresh());
    }

    public void setParent(AdminDesktopController parent) {
        this.parent = parent;
    }

    public void loadHistory(List<SyncHistoryDTO> history) {
        historyTable.setItems(FXCollections.observableArrayList(history));
    }

    public void loadStatus(SyncStatusDTO status) {
        lastPushLabel.setText(status.lastPush() != null ? formatTimestamp(status.lastPush()) : "—");
        lastPullLabel.setText(status.lastPull() != null ? formatTimestamp(status.lastPull()) : "—");
        pendingOperationsLabel.setText(String.valueOf(status.pendingOperations()));
    }

    public void refresh() {
        loadHistory(parent.getSyncManagement().history());
        loadStatus(parent.getSyncManagement().status());
    }

    private static String formatTimestamp(String isoTimestamp) {
        try {
            return DISPLAY_FORMAT.format(Instant.parse(isoTimestamp));
        } catch (Exception e) {
            return isoTimestamp;
        }
    }
}
