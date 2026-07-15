package com.connectneighbours.admindesktop.ui.ui.features.theme.createtheme.controller;

import com.connectneighbours.admindesktop.ui.ui.features.theme.createtheme.viewmodel.CreateThemeViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.theme.model.ReadOnlyThemeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.theme.model.SimpleThemeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.theme.model.ThemeProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.ColorPicker;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;

import java.io.IOException;
import java.util.UUID;
import java.util.function.Consumer;

public class CreateThemeController extends VBox {
    private final CreateThemeViewModel viewModel = new CreateThemeViewModel();
    private UUID editingUuid;

    @FXML
    private Button btnReturn;
    @FXML
    private Button btnCancel;
    @FXML
    private Button btnSave;
    @FXML
    private Label formTitle;
    @FXML
    private TextField nameField;
    @FXML
    private Label nameError;
    @FXML
    private ColorPicker colorPicker;

    private Runnable onCancel;
    private Consumer<ThemeProperty> onSave;

    public CreateThemeController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/connectneighbours/admindesktop/ui/ui/features/theme/createtheme/view/create-theme-view.fxml"));
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
        colorPicker.setValue(Color.web("#1A73E8"));

        btnReturn.setOnAction(e -> cancel());
        btnCancel.setOnAction(e -> cancel());
        btnSave.setOnAction(e -> save());
    }

    public void setOnCancel(Runnable onCancel) {
        this.onCancel = onCancel;
    }

    public void setOnSave(Consumer<ThemeProperty> onSave) {
        this.onSave = onSave;
    }

    public void loadForCreate() {
        editingUuid = null;
        formTitle.setText("Créer un thème");
        viewModel.setTheme(null);
        nameField.setText("");
        colorPicker.setValue(Color.web("#1A73E8"));
    }

    public void loadForEdit(ReadOnlyThemeProperty theme) {
        editingUuid = theme.uuidProperty().get();
        formTitle.setText("Modifier le thème");
        viewModel.setTheme(theme);
        nameField.setText(theme.nameProperty().get());
        colorPicker.setValue(Color.rgb(theme.redProperty().get(), theme.greenProperty().get(), theme.blueProperty().get()));
    }

    private void cancel() {
        if (onCancel != null) onCancel.run();
    }

    private void save() {
        if (!validate()) return;
        if (onSave != null) onSave.accept(buildProperty());
    }

    private boolean validate() {
        if (nameField.getText() == null || nameField.getText().isBlank()) {
            nameField.getStyleClass().add("form-field-error");
            nameError.setText("Le nom du thème est obligatoire");
            nameError.setVisible(true);
            nameError.setManaged(true);
            return false;
        }

        nameField.getStyleClass().remove("form-field-error");
        nameError.setText("");
        nameError.setVisible(false);
        nameError.setManaged(false);
        return true;
    }

    private ThemeProperty buildProperty() {
        SimpleThemeProperty property = new SimpleThemeProperty();
        property.uuidProperty().set(editingUuid);
        property.nameProperty().set(nameField.getText());

        Color color = colorPicker.getValue();
        property.redProperty().set((int) Math.round(color.getRed() * 255));
        property.greenProperty().set((int) Math.round(color.getGreen() * 255));
        property.blueProperty().set((int) Math.round(color.getBlue() * 255));

        return property;
    }
}
