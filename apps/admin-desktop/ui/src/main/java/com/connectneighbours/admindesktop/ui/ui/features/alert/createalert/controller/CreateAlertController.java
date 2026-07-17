package com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.controller;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.model.CreateAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.model.SimpleCreateAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.viewmodel.CreateAlertViewModel;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.function.Consumer;

public class CreateAlertController extends VBox {

    @FXML
    private Button btnReturn;
    @FXML
    private Button btnCancel;
    @FXML
    private Button btnCreate;
    @FXML
    private TextField titleField;
    @FXML
    private TextField descriptionField;
    @FXML
    private HBox severityBox;
    @FXML
    private ToggleButton severityLow;
    @FXML
    private ToggleButton severityMedium;
    @FXML
    private ToggleButton severityHigh;
    @FXML
    private ToggleButton severityCritical;
    @FXML
    private Label titleError;
    @FXML
    private Label descriptionError;
    @FXML
    private Label severityError;

    private final ToggleGroup severityGroup = new ToggleGroup();

    private Runnable onCancel;
    private Consumer<CreateAlertProperty> onCreate;

    public CreateAlertController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/connectneighbours/admindesktop/ui/ui/features/alert/createalert/view/create-alert-view.fxml"));
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
        severityLow.setToggleGroup(severityGroup);
        severityMedium.setToggleGroup(severityGroup);
        severityHigh.setToggleGroup(severityGroup);
        severityCritical.setToggleGroup(severityGroup);

        btnReturn.setOnAction(e -> cancel());
        btnCancel.setOnAction(e -> cancel());
        btnCreate.setOnAction(e -> create());
    }

    public void setOnCancel(Runnable onCancel) {
        this.onCancel = onCancel;
    }

    public void setOnCreate(Consumer<CreateAlertProperty> onCreate) {
        this.onCreate = onCreate;
    }

    private void cancel() {
        if (onCancel != null) onCancel.run();
    }

    private void create() {
        if (!validate()) return;
        if (onCreate != null) onCreate.accept(buildProperty());
    }

    private boolean validate() {
        boolean valid = true;

        if (titleField.getText() == null || titleField.getText().isBlank()) {
            showError(titleField, titleError, "Le titre de l'alerte est obligatoire");
            valid = false;
        } else {
            hideError(titleField, titleError);
        }

        if (descriptionField.getText() == null || descriptionField.getText().isBlank()) {
            showError(descriptionField, descriptionError, "La description de l'alerte est obligatoire");
            valid = false;
        } else {
            hideError(descriptionField, descriptionError);
        }

        if (selectedSeverity() == null) {
            severityError.setText("Veuillez sélectionner une gravité");
            severityError.setVisible(true);
            severityError.setManaged(true);
            valid = false;
        } else {
            severityError.setText("");
            severityError.setVisible(false);
            severityError.setManaged(false);
        }

        return valid;
    }

    private void showError(TextField field, Label errorLabel, String message) {
        field.getStyleClass().add("form-field-error");
        errorLabel.setText(message);
        errorLabel.setVisible(true);
        errorLabel.setManaged(true);
    }

    private void hideError(TextField field, Label errorLabel) {
        field.getStyleClass().remove("form-field-error");
        errorLabel.setText("");
        errorLabel.setVisible(false);
        errorLabel.setManaged(false);
    }

    private CreateAlertProperty buildProperty() {
        SimpleCreateAlertProperty property = new SimpleCreateAlertProperty();
        property.titleProperty().set(titleField.getText());
        property.descriptionProperty().set(descriptionField.getText());
        property.severityProperty().set(selectedSeverity());
        return property;
    }

    private AlertSeverity selectedSeverity() {
        if (severityLow.isSelected()) return AlertSeverity.LOW;
        if (severityMedium.isSelected()) return AlertSeverity.MEDIUM;
        if (severityHigh.isSelected()) return AlertSeverity.HIGH;
        if (severityCritical.isSelected()) return AlertSeverity.CRITICAL;
        return null;
    }

    public CreateAlertViewModel toCreateAlertViewModel(CreateAlertProperty property) {
        CreateAlertViewModel vm = new CreateAlertViewModel();
        vm.setCreateAlertProperty(property);
        return vm;
    }
}
