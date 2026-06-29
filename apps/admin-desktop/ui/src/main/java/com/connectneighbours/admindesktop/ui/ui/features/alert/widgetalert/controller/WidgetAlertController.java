package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.controller;

import com.connectneighbours.admindesktop.ui.ui.features.alert.utils.AlertFormatting;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.alertsymbol.controller.WarningSymbolController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model.ReadOnlyWidgetAlertProperty;
import com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.viewmodel.WidgetAlertViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.viewmodel.ReporterViewModel;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

import java.io.IOException;

public class WidgetAlertController extends AnchorPane {
    private WarningSymbolController symbol;

    @FXML
    private AnchorPane widgetHeaderContainer;
    @FXML
    private Pane warningSymbolContainer;
    @FXML
    private Label titleLabel;
    @FXML
    private Label reporterLabel;
    @FXML
    private ImageView avatarImage;
    @FXML
    private TextFlow createdAtFlow;
    @FXML
    private TextFlow statusFlow;
    @FXML
    private TextFlow detailsFlow;

    private final WidgetAlertViewModel viewModelWidget = new WidgetAlertViewModel();

    public WidgetAlertController() {
        FXMLLoader loader = new FXMLLoader(
                getClass().getResource("/com/connectneighbours/admindesktop/ui/ui/features/alert/widgetalert/view/widget-alert-view.fxml")
        );
        loader.setRoot(this);
        loader.setController(this);

        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException("Erreur chargement widget-alert-view.fxml", e);
        }
    }

    @FXML
    private void initialize() {
        symbol = new WarningSymbolController();
        warningSymbolContainer.getChildren().add(symbol);
        titleLabel.textProperty().bind(viewModelWidget.alertProperty().titleProperty());
        avatarImage.imageProperty().bind(viewModelWidget.alertProperty().reporterProperty().avatarProperty());
        reporterLabel.textProperty().bind(viewModelWidget.alertProperty().reporterNameProperty());
        detailsFlow.setPrefWidth(300);
        detailsFlow.setMaxWidth(300);
    }

    public void setAlert(ReadOnlyWidgetAlertProperty alert) {
        viewModelWidget.setAlert(alert);
        refreshCreatedAt();
        refreshStatus();
        refreshDetails();
        refreshSeverity();
    }

    private void refreshCreatedAt() {
        var createdAt = viewModelWidget.alertProperty().createdAtProperty().get();

        createdAtFlow.getChildren().setAll(
                new Text("Créée le : "),
                new Text(createdAt != null ? createdAt.toString() : "-")
        );
    }

    private void refreshStatus() {
        statusFlow.getChildren().clear();

        statusFlow.getChildren().addAll(
                new Text("Statut : "),
                new Text(AlertFormatting.formatAlertStatus(viewModelWidget.alertProperty().statusProperty().get()))
        );

        var resolvedAt = viewModelWidget.alertProperty().resolvedAtProperty().get();

        if ("RESOLVED".equals(viewModelWidget.alertProperty().statusProperty().get())) {
            statusFlow.getChildren().addAll(
                    new Text(" – Résolue le : "),
                    new Text(resolvedAt != null ? resolvedAt.toString() : "-")
            );
        }
    }

    private void refreshDetails() {
        var details = viewModelWidget.alertProperty().detailsProperty().get();

        detailsFlow.getChildren().setAll(
                new Text("Détails : "),
                new Text(!details.isBlank() ? details : "-")
        );
    }

    private void refreshSeverity() {
        var severity = viewModelWidget.alertProperty().severityProperty().get();
        switch (severity) {
            case "LOW":
                widgetHeaderContainer.setStyle("-fx-background-color: #6BB763; -fx-background-radius: 8 8 0 0;");
                symbol.setColor(Color.color(0.98F, 0.98F, 0.98F));
                symbol.getIcon().setFill(Color.color(0.42, 0.72, 0.39));
                break;
            case "MEDIUM":
                widgetHeaderContainer.setStyle("-fx-background-color: #FEDDAA; -fx-background-radius: 8 8 0 0;");
                symbol.setColor(Color.color(0.67F, 0.18F, 0.05));
                symbol.getIcon().setFill(Color.color(1.0, 0.87, 0.67));
                titleLabel.styleProperty().set("-fx-text-fill: #AF5932; -fx-font-weight: bold; -fx-font-size: 14;");
                break;
            case "HIGH":
                widgetHeaderContainer.setStyle("-fx-background-color: #253CB1; -fx-background-radius: 8 8 0 0;");
                symbol.setColor(Color.color(0.04F, 0.52F, 0.78F));
                symbol.getIcon().setFill(Color.color(0.15, 0.24, 0.69));
                break;
            case "CRITICAL":
                symbol.setColor(Color.color(0.98F, 0.98F, 0.98F));
                break;
        }
    }
}
