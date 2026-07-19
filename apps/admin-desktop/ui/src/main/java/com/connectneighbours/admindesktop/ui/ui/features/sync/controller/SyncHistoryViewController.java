package com.connectneighbours.admindesktop.ui.ui.features.sync.controller;

import com.connectneighbours.admindesktop.back.application.sync.SyncHistoryDTO;
import com.connectneighbours.admindesktop.back.application.sync.SyncStatusDTO;
import com.connectneighbours.admindesktop.back.domain.exception.sync.SyncFailedException;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import com.connectneighbours.admindesktop.ui.ui.features.sync.model.SimpleSyncHistoryProperty;
import com.connectneighbours.admindesktop.ui.ui.features.sync.viewmodel.SyncHistoryViewModel;
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
    private Button btnSynchronize;
    @FXML
    private Button btnRefresh;
    @FXML
    private Label lastPushLabel;
    @FXML
    private Label lastPullLabel;
    @FXML
    private Label pendingOperationsLabel;
    @FXML
    private Label syncFeedbackLabel;
    @FXML
    private TableView<SyncHistoryViewModel> historyTable;
    @FXML
    private TableColumn<SyncHistoryViewModel, String> typeColumn;
    @FXML
    private TableColumn<SyncHistoryViewModel, String> timestampColumn;
    @FXML
    private TableColumn<SyncHistoryViewModel, Number> countColumn;

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
        typeColumn.setCellValueFactory(data -> data.getValue().syncHistoryProperty().typeProperty());
        timestampColumn.setCellValueFactory(data -> data.getValue().syncHistoryProperty().timestampProperty());
        countColumn.setCellValueFactory(data -> data.getValue().syncHistoryProperty().countProperty());

        historyTable.setItems(FXCollections.observableArrayList());

        btnRefresh.setOnAction(e -> refresh());
        btnSynchronize.setOnAction(e -> synchronize());
    }

    public void setParent(AdminDesktopController parent) {
        this.parent = parent;
    }

    public void loadHistory(List<SyncHistoryDTO> history) {
        List<SyncHistoryViewModel> models = history.stream()
                .map(dto -> {
                    var vm = new SyncHistoryViewModel();
                    vm.setDto(dto);
                    vm.setSyncHistory(toProperty(dto));
                    return vm;
                })
                .toList();

        historyTable.setItems(FXCollections.observableArrayList(models));
    }

    private SimpleSyncHistoryProperty toProperty(SyncHistoryDTO dto) {
        var property = new SimpleSyncHistoryProperty();
        property.timestampProperty().set(formatTimestamp(dto.timestamp()));
        property.typeProperty().set(dto.type());
        property.countProperty().set(dto.count());
        return property;
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

    private void synchronize() {
        btnSynchronize.setDisable(true);

        try {
            var result = parent.getSyncManagement().synchronize();
            showFeedback(result.pushedCount() + " envoye(s), " + result.pulledCount() + " recu(s)", false);
            refresh();
        } catch (SyncFailedException e) {
            showFeedback(e.getMessage(), true);
        } finally {
            btnSynchronize.setDisable(false);
        }
    }

    private void showFeedback(String message, boolean isError) {
        syncFeedbackLabel.setText(message);
        syncFeedbackLabel.getStyleClass().removeAll("error");
        if (isError) {
            syncFeedbackLabel.getStyleClass().add("error");
        }
        syncFeedbackLabel.setVisible(true);
        syncFeedbackLabel.setManaged(true);
    }

    private static String formatTimestamp(String isoTimestamp) {
        try {
            return DISPLAY_FORMAT.format(Instant.parse(isoTimestamp));
        } catch (Exception e) {
            return isoTimestamp;
        }
    }
}
