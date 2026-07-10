package com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.controller;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model.IncidentPerDayProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.viewmodel.IncidentPerDayViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.utils.IncidentFormatting;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.chart.CategoryAxis;
import javafx.scene.chart.NumberAxis;
import javafx.scene.chart.StackedBarChart;
import javafx.scene.chart.XYChart;
import javafx.scene.control.Tooltip;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.List;

public class IncidentPerDayController extends VBox {

    @FXML private StackedBarChart<String, Number> chart;
    @FXML private CategoryAxis xAxis;
    @FXML private NumberAxis yAxis;

    public IncidentPerDayController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/incident/incidentgraph/incidentperday/view/incident-per-day-view.fxml"
        ));
        loader.setRoot(this);
        loader.setController(this);

        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        chart.getStyleClass().add("incident-chart");

        var cssUrl = getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/incident/incidentgraph/incidentperday/view/incident-per-day.css"
        );
        if (cssUrl != null) {
            chart.getStylesheets().add(cssUrl.toExternalForm());
        }

        chart.setTitle("Incidents par Jour");
        chart.setAnimated(true);
        chart.setCategoryGap(20);

        yAxis.setAutoRanging(false);
        yAxis.setUpperBound(20);
        yAxis.setTickUnit(5);
    }

    public void bind(List<IncidentPerDayViewModel> list) {

        var dates = list.stream()
                .map(vm -> vm.incidentPerDayProperty().dateTimeProperty().get().toLocalDate().toString())
                .distinct()
                .sorted()
                .toList();

        xAxis.setCategories(FXCollections.observableArrayList(dates));

        for (IncidentType type : IncidentType.values()) {

            XYChart.Series<String, Number> series = new XYChart.Series<>();
            series.setName(IncidentFormatting.format(type.toString()));

            for (String date : dates) {
                long count = list.stream()
                        .filter(vm -> vm.incidentPerDayProperty().typeProperty().get() == type)
                        .filter(vm -> vm.incidentPerDayProperty().dateTimeProperty().get().toLocalDate().toString().equals(date))
                        .mapToLong(vm -> vm.incidentPerDayProperty().countProperty().get())
                        .sum();

                XYChart.Data<String, Number> data = new XYChart.Data<>(date, count);
                series.getData().add(data);
            }

            chart.getData().add(series);
        }

        chart.getData().forEach(s ->
                s.getData().forEach(d ->
                        Tooltip.install(d.getNode(), new Tooltip(d.getYValue().toString()))
                )
        );
    }

    public IncidentPerDayViewModel toIncidentPerDayViewModel(IncidentPerDayProperty property) {
        IncidentPerDayViewModel vm = new IncidentPerDayViewModel();
        vm.setIncidentPerDayProperty(property);
        return vm;
    }
}


