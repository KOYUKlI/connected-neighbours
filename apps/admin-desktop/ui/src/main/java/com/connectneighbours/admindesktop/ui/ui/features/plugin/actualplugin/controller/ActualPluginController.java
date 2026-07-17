package com.connectneighbours.admindesktop.ui.ui.features.plugin.actualplugin.controller;

import com.connectneighbours.admindesktop.ui.ui.features.plugin.actualplugin.viewmodel.ActualPluginViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.controller.PluginViewController;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.model.ReadOnlyPluginProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

import java.io.IOException;

public class ActualPluginController extends VBox {
    private final ActualPluginViewModel viewModel = new ActualPluginViewModel();
    private PluginViewController parent;

    @FXML
    private Label nameLabel;
    @FXML
    private Label versionLabel;
    @FXML
    private Label authorLabel;
    @FXML
    private Label descriptionLabel;
    @FXML
    private Button btnExecute;
    @FXML
    private Button btnRefresh;
    @FXML
    private Button btnClose;
    @FXML
    private VBox logContainer;

    public ActualPluginController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/plugin/actualplugin/view/actual-plugin-view.fxml"
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
        btnExecute.setOnAction(e -> executePlugin());
        btnRefresh.setOnAction(e -> refreshLogs());
        btnClose.setOnAction(e -> close());
    }

    public void setParent(PluginViewController parent) {
        this.parent = parent;
    }

    public void setPlugin(ReadOnlyPluginProperty source) {
        viewModel.setPlugin(source);

        var p = viewModel.pluginProperty();
        nameLabel.setText(p.nameProperty().get());
        versionLabel.setText(p.versionProperty().get());
        authorLabel.setText(p.authorProperty().get());
        descriptionLabel.setText(p.descriptionProperty().get());

        refreshLogs();
    }

    private void executePlugin() {
        var uuid = viewModel.pluginProperty().uuidProperty().get();
        try {
            parent.getPluginManagement().execute(uuid);
        } catch (Exception ex) {
            showError("Échec de l'exécution du plugin : " + ex.getMessage());
        } finally {
            refreshLogs();
        }
    }

    private void refreshLogs() {
        logContainer.getChildren().clear();
        for (String line : parent.getPluginManagement().getLogs()) {
            Label logLine = new Label(line);
            logLine.getStyleClass().add("actual-plugin-log-line");
            logContainer.getChildren().add(logLine);
        }
    }

    private void close() {
        if (parent != null) parent.clearSelection();
    }

    private void showError(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Erreur");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
