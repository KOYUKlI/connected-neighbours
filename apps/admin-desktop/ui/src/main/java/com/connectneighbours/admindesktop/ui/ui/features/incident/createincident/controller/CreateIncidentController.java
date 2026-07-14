package com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.controller;

import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.model.CreateIncidentProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.viewmodel.CreateIncidentViewModel;
import javafx.fxml.FXMLLoader;
import javafx.scene.layout.VBox;

import java.io.IOException;

public class CreateIncidentController extends VBox {

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

    public CreateIncidentViewModel toCreateIncidentViewModel(CreateIncidentProperty property) {
        CreateIncidentViewModel vm = new CreateIncidentViewModel();
        vm.setCreateIncidentProperty(property);
        return vm;
    }
}
