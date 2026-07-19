package com.connectneighbours.admindesktop.ui.ui.features.plugin.controller;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.PluginDTO;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.PluginManagement;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.actualplugin.controller.ActualPluginController;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.model.PluginProperty;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.model.SimplePluginProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;

import java.io.IOException;
import java.util.List;

public class PluginViewController extends VBox {
    private AdminDesktopController parent;
    private HBox selectedRow;

    @FXML
    private Button btnLoadPlugin;
    @FXML
    private VBox pluginList;
    @FXML
    private VBox detailContainer;

    public PluginViewController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/plugin/view/plugin-view.fxml"
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
        btnLoadPlugin.setOnAction(e -> loadPluginFromDisk());
    }

    public void setParent(AdminDesktopController parent) {
        this.parent = parent;
    }

    public void loadPlugins(List<PluginDTO> plugins) {
        pluginList.getChildren().clear();
        selectedRow = null;

        for (PluginDTO dto : plugins) {
            HBox row = buildRow(dto);
            pluginList.getChildren().add(row);
        }

        if (!plugins.isEmpty()) {
            selectPlugin(plugins.get(0), (HBox) pluginList.getChildren().get(0));
        } else {
            clearSelection();
        }
    }

    private HBox buildRow(PluginDTO dto) {
        Label icon = new Label("🧩");
        icon.getStyleClass().add("plugin-row-icon");

        Label name = new Label(dto.name());
        name.getStyleClass().add("plugin-row-name");

        HBox row = new HBox(10, icon, name);
        row.getStyleClass().add("plugin-row");
        row.setOnMouseClicked(e -> selectPlugin(dto, row));
        return row;
    }

    private void selectPlugin(PluginDTO dto, HBox row) {
        if (selectedRow != null) selectedRow.getStyleClass().remove("plugin-row-selected");
        row.getStyleClass().add("plugin-row-selected");
        selectedRow = row;

        ActualPluginController actualPlugin = new ActualPluginController();
        actualPlugin.setParent(this);
        actualPlugin.setPlugin(toPluginProperty(dto));
        detailContainer.getChildren().setAll(actualPlugin);
    }

    public void clearSelection() {
        if (selectedRow != null) {
            selectedRow.getStyleClass().remove("plugin-row-selected");
            selectedRow = null;
        }

        Label placeholder = new Label("Sélectionnez un plugin");
        placeholder.getStyleClass().add("plugin-placeholder-text");
        detailContainer.getChildren().setAll(placeholder);
    }

    private PluginProperty toPluginProperty(PluginDTO dto) {
        SimplePluginProperty p = new SimplePluginProperty();
        p.uuidProperty().set(dto.uuid());
        p.nameProperty().set(dto.name());
        p.versionProperty().set(dto.version());
        p.authorProperty().set(dto.author());
        p.descriptionProperty().set(dto.description());
        p.statePluginProperty().set(dto.statePlugin());
        return p;
    }

    private void loadPluginFromDisk() {
        FileChooser chooser = new FileChooser();
        chooser.setTitle("Charger un plugin");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("Fichier plugin (*.jar)", "*.jar"));
        var file = chooser.showOpenDialog(getScene().getWindow());
        if (file == null) return;

        try {
            getPluginManagement().install(file);
            reload();
        } catch (RuntimeException ex) {
            showError("Impossible d'installer le plugin : " + ex.getMessage());
        }
    }

    public void reload() {
        loadPlugins(getPluginManagement().listPlugins());
    }

    public PluginManagement getPluginManagement() {
        return parent.getPluginManagement();
    }

    private void showError(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Erreur");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
