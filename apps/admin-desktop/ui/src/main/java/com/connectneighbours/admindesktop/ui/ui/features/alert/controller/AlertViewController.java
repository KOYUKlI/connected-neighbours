package com.connectneighbours.admindesktop.ui.ui.features.alert.controller;

import com.connectneighbours.admindesktop.ui.ui.HelloController;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuItem;
import javafx.scene.layout.VBox;

import java.io.IOException;

public class AlertViewController extends VBox {
    private HelloController parent;
    private String selectedGravity = "Toutes";
    private String selectedStatus = "Tous";
    private String selectedDate = "Toutes";


    @FXML private Button btnReturn;

    @FXML private Menu menuGravity;
    @FXML private MenuItem gravityAll;
    @FXML private MenuItem gravityCritical;
    @FXML private MenuItem gravityHigh;
    @FXML private MenuItem gravityMedium;
    @FXML private MenuItem gravityLow;

    @FXML private Menu menuStatus;
    @FXML private MenuItem statusAll;
    @FXML private MenuItem statusResolved;
    @FXML private MenuItem statusInProgress;
    @FXML private MenuItem statusClosed;

    @FXML private Menu menuDate;
    @FXML private MenuItem dateAll;
    @FXML private MenuItem dateToday;
    @FXML private MenuItem dateWeek;
    @FXML private MenuItem dateMonth;



    public AlertViewController() {
        FXMLLoader loader = new FXMLLoader(
                getClass().getResource(
                        "../view/alert-view.fxml"
                )
        );
        loader.setRoot(this);
        loader.setController(this);
        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        this.sceneProperty().addListener((obs, oldScene, newScene) -> {
            if (newScene != null) {
                this.prefHeightProperty().bind(newScene.heightProperty());
            }
        });
    }

    public void setParent(HelloController parent) {
        this.parent = parent;
    }

    @FXML
    private void initialize() {
        btnReturn.setOnAction(e -> goToIncident());


        gravityAll.setOnAction(e -> selectedGravity = "Toutes");
        gravityCritical.setOnAction(e -> selectedGravity = "Critique");
        gravityHigh.setOnAction(e -> selectedGravity = "Haute");
        gravityMedium.setOnAction(e -> selectedGravity = "Moyenne");
        gravityLow.setOnAction(e -> selectedGravity = "Mineure");

        statusAll.setOnAction(e -> selectedStatus = "Tous");
        statusResolved.setOnAction(e -> selectedStatus = "Résolue");
        statusInProgress.setOnAction(e -> selectedStatus = "En cours");
        statusClosed.setOnAction(e -> selectedStatus = "Fermée");

        dateAll.setOnAction(e -> selectedDate = "Toutes");
        dateToday.setOnAction(e -> selectedDate = "Aujourd’hui");
        dateWeek.setOnAction(e -> selectedDate = "Cette semaine");
        dateMonth.setOnAction(e -> selectedDate = "Ce mois");

    }

    @FXML
    protected void goToIncident() {
        if (parent != null) {
            parent.showHome();
        }
    }

    @FXML
    private void applyFilters() {
        System.out.println("Gravité : " + selectedGravity);
        System.out.println("Statut : " + selectedStatus);
        System.out.println("Date : " + selectedDate);

        //refreshAlertList();
    }

}
