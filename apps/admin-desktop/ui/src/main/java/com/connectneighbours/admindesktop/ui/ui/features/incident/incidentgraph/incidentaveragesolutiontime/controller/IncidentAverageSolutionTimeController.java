package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.controller;

import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model.IncidentAverageSolutionTimeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.viewmodel.IncidentAverageSolutionTimeViewModel;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.chart.AreaChart;
import javafx.scene.chart.CategoryAxis;
import javafx.scene.chart.NumberAxis;
import javafx.scene.chart.XYChart;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.List;

public class IncidentAverageSolutionTimeController extends VBox {
    @FXML private  AreaChart<String,Number> areaChart;
    @FXML private CategoryAxis xAxis;
    @FXML private NumberAxis yAxis;

    public IncidentAverageSolutionTimeController() {
        FXMLLoader loader = new FXMLLoader(
                getClass().getResource("/com/connectneighbours/admindesktop/ui/ui/features/incident/incidentgraph/incidentaveragesolutiontime/view/incident-average-solution-time-view.fxml")
        );

        loader.setRoot(this);
        loader.setController(this);

        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        areaChart.setTitle("Temps Moyen de Résolution");
        areaChart.setAnimated(true);
    }

    public void bind(List<IncidentAverageSolutionTimeViewModel> list) {

        List<String> dates = list.stream()
                .map(vm -> vm.incidentAverageSolutionTimeProperty().dateTimeProperty().get().toLocalDate().toString())
                .distinct()
                .sorted()
                .toList();

        xAxis.setCategories(FXCollections.observableArrayList(dates));

        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Temps moyen (minutes)");

        for (String date : dates) {
            var vm = list.stream()
                    .filter(v -> v.incidentAverageSolutionTimeProperty().dateTimeProperty().get().toLocalDate().toString().equals(date))
                    .findFirst()
                    .orElse(null);

            if (vm != null) {
                long avg = vm.incidentAverageSolutionTimeProperty().durationProperty().get();
                series.getData().add(new XYChart.Data<>(date, avg));
            }
        }

        areaChart.getData().clear();
        areaChart.getData().add(series);
    }


    public IncidentAverageSolutionTimeViewModel toIncidentAverageSolutionTimeViewModel(IncidentAverageSolutionTimeProperty property) {
        IncidentAverageSolutionTimeViewModel vm = new IncidentAverageSolutionTimeViewModel();
        vm.setIncidentAverageSolutionTime(property);
        return vm;
    }

}
