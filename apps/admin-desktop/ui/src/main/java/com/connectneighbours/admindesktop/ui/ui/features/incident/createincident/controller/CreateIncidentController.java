package com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.controller;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model.CreateIncidentProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model.SimpleCreateIncidentProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.viewmodel.CreateIncidentViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.utils.IncidentFormatting;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.util.StringConverter;

import java.io.IOException;
import java.util.function.Consumer;

public class CreateIncidentController extends VBox {

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
    private ComboBox<IncidentType> typeCombo;
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
    private Label typeError;
    @FXML
    private Label severityError;

    private final ToggleGroup severityGroup = new ToggleGroup();

    private Runnable onCancel;
    private Consumer<CreateIncidentProperty> onCreate;

    public CreateIncidentController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/connectneighbours/admindesktop/ui/ui/features/incident/createincident/view/create-incident-view.fxml"));
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

        typeCombo.setItems(FXCollections.observableArrayList(IncidentType.values()));
        typeCombo.setConverter(new StringConverter<>() {
            @Override
            public String toString(IncidentType type) {
                return type == null ? "" : IncidentFormatting.format(type.toString());
            }

            @Override
            public IncidentType fromString(String string) {
                return null;
            }
        });

        btnReturn.setOnAction(e -> cancel());
        btnCancel.setOnAction(e -> cancel());
        btnCreate.setOnAction(e -> create());
    }

    public void setOnCancel(Runnable onCancel) {
        this.onCancel = onCancel;
    }

    public void setOnCreate(Consumer<CreateIncidentProperty> onCreate) {
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
            showFieldError(titleField, titleError, "Le titre de l'incident est obligatoire");
            valid = false;
        } else {
            hideFieldError(titleField, titleError);
        }

        if (descriptionField.getText() == null || descriptionField.getText().isBlank()) {
            showFieldError(descriptionField, descriptionError, "La description de l'incident est obligatoire");
            valid = false;
        } else {
            hideFieldError(descriptionField, descriptionError);
        }

        if (typeCombo.getValue() == null) {
            showError(typeError, "Veuillez sélectionner un type");
            valid = false;
        } else {
            hideError(typeError);
        }

        if (selectedSeverity() == null) {
            showError(severityError, "Veuillez sélectionner une gravité");
            valid = false;
        } else {
            hideError(severityError);
        }

        return valid;
    }

    private void showFieldError(TextField field, Label errorLabel, String message) {
        field.getStyleClass().add("form-field-error");
        showError(errorLabel, message);
    }

    private void hideFieldError(TextField field, Label errorLabel) {
        field.getStyleClass().remove("form-field-error");
        hideError(errorLabel);
    }

    private void showError(Label errorLabel, String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
        errorLabel.setManaged(true);
    }

    private void hideError(Label errorLabel) {
        errorLabel.setText("");
        errorLabel.setVisible(false);
        errorLabel.setManaged(false);
    }

    private CreateIncidentProperty buildProperty() {
        SimpleCreateIncidentProperty property = new SimpleCreateIncidentProperty();
        property.titleProperty().set(titleField.getText());
        property.descriptionProperty().set(descriptionField.getText());
        property.typeProperty().set(typeCombo.getValue());
        property.severityProperty().set(selectedSeverity());
        return property;
    }

    private IncidentSeverity selectedSeverity() {
        if (severityLow.isSelected()) return IncidentSeverity.LOW;
        if (severityMedium.isSelected()) return IncidentSeverity.MEDIUM;
        if (severityHigh.isSelected()) return IncidentSeverity.HIGH;
        if (severityCritical.isSelected()) return IncidentSeverity.CRITICAL;
        return null;
    }

    public CreateIncidentViewModel toCreateIncidentViewModel(CreateIncidentProperty property) {
        CreateIncidentViewModel vm = new CreateIncidentViewModel();
        vm.setCreateIncidentProperty(property);
        return vm;
    }
}
