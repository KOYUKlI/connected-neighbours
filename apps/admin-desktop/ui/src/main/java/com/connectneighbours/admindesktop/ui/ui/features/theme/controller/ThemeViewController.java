package com.connectneighbours.admindesktop.ui.ui.features.theme.controller;

import com.connectneighbours.admindesktop.back.application.theme.CreationThemeDTO;
import com.connectneighbours.admindesktop.back.application.theme.ThemeDTO;
import com.connectneighbours.admindesktop.back.application.theme.ThemeManagement;
import com.connectneighbours.admindesktop.back.application.theme.UpdateThemeDTO;
import com.connectneighbours.admindesktop.back.domain.theme.RGB;
import com.connectneighbours.admindesktop.back.infrastructure.theme.ThemeContext;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import com.connectneighbours.admindesktop.ui.ui.features.theme.createtheme.controller.CreateThemeController;
import com.connectneighbours.admindesktop.ui.ui.features.theme.model.ReadOnlyThemeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.theme.model.SimpleThemeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.theme.model.ThemeProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;

import java.io.IOException;
import java.util.List;

public class ThemeViewController extends VBox {
    private AdminDesktopController parent;

    @FXML
    private Button createTheme;
    @FXML
    private VBox themeList;

    public ThemeViewController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/theme/view/theme-view.fxml"
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
        createTheme.setOnAction(e -> goToCreateTheme());
    }

    public void setParent(AdminDesktopController parent) {
        this.parent = parent;
    }

    public void loadThemes(List<ThemeDTO> themes) {
        themeList.getChildren().clear();

        for (ThemeDTO dto : themes) {
            themeList.getChildren().add(buildRow(dto));
        }
    }

    private HBox buildRow(ThemeDTO dto) {
        Circle swatch = new Circle(10, Color.rgb(dto.rgb().red().intValue(), dto.rgb().green().intValue(), dto.rgb().blue().intValue()));
        swatch.getStyleClass().add("theme-swatch");

        Label name = new Label(dto.name());
        name.getStyleClass().add("theme-row-name");

        boolean isActive = getThemeContext().getActiveTheme() != null
                && getThemeContext().getActiveTheme().uuid().equals(dto.uuid());

        Label activeLabel = new Label(isActive ? "Actif" : "");
        activeLabel.getStyleClass().add("theme-row-active-label");

        Button activate = new Button("Activer");
        activate.getStyleClass().add("return-button");
        activate.setOnAction(e -> {
            parent.applyTheme(dto);
            loadThemes(getThemeManagement().listThemes());
        });

        Button edit = new Button("Modifier");
        edit.getStyleClass().add("return-button");
        edit.setOnAction(e -> goToEditTheme(dto));

        Button delete = new Button("Supprimer");
        delete.getStyleClass().add("return-button");
        delete.setOnAction(e -> deleteTheme(dto));

        HBox row = new HBox(10, swatch, name, activeLabel, new Region(), activate, edit, delete);
        HBox.setHgrow(row.getChildren().get(3), javafx.scene.layout.Priority.ALWAYS);
        row.getStyleClass().add("theme-row");
        if (isActive) row.getStyleClass().add("theme-row-active");

        return row;
    }

    private void deleteTheme(ThemeDTO dto) {
        try {
            getThemeManagement().deleteTheme(dto.uuid());
            loadThemes(getThemeManagement().listThemes());
        } catch (RuntimeException ex) {
            showError("Impossible de supprimer ce thème : " + ex.getMessage());
        }
    }

    public void goToCreateTheme() {
        CreateThemeController form = new CreateThemeController();
        form.loadForCreate();

        form.setOnCancel(() -> parent.getMainContainer().getChildren().setAll(this));

        form.setOnSave(property -> {
            getThemeManagement().createTheme(new CreationThemeDTO(property.nameProperty().get(), toRgb(property)));
            loadThemes(getThemeManagement().listThemes());
            parent.getMainContainer().getChildren().setAll(this);
        });

        parent.getMainContainer().getChildren().setAll(form);
    }

    public void goToEditTheme(ThemeDTO dto) {
        CreateThemeController form = new CreateThemeController();
        form.loadForEdit(toThemeProperty(dto));

        form.setOnCancel(() -> parent.getMainContainer().getChildren().setAll(this));

        form.setOnSave(property -> {
            getThemeManagement().updateTheme(dto.uuid(), new UpdateThemeDTO(property.nameProperty().get(), toRgb(property)));
            loadThemes(getThemeManagement().listThemes());
            parent.getMainContainer().getChildren().setAll(this);
        });

        parent.getMainContainer().getChildren().setAll(form);
    }

    private RGB toRgb(ThemeProperty property) {
        return new RGB((long) property.redProperty().get(), (long) property.greenProperty().get(), (long) property.blueProperty().get());
    }

    private ReadOnlyThemeProperty toThemeProperty(ThemeDTO dto) {
        SimpleThemeProperty p = new SimpleThemeProperty();
        p.uuidProperty().set(dto.uuid());
        p.nameProperty().set(dto.name());
        p.redProperty().set(dto.rgb().red().intValue());
        p.greenProperty().set(dto.rgb().green().intValue());
        p.blueProperty().set(dto.rgb().blue().intValue());
        return p;
    }

    private void showError(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Erreur");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    public ThemeManagement getThemeManagement() {
        return parent.getThemeManagement();
    }

    public ThemeContext getThemeContext() {
        return parent.getThemeContext();
    }
}
