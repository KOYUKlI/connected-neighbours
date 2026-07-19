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
import javafx.scene.control.ContextMenu;
import javafx.scene.control.MenuItem;
import javafx.scene.control.TextInputDialog;
import javafx.scene.control.Tooltip;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.List;
import java.util.function.IntConsumer;

public class IncidentPerDayController extends VBox {

    @FXML private StackedBarChart<String, Number> chart;
    @FXML private CategoryAxis xAxis;
    @FXML private NumberAxis yAxis;

    private IntConsumer onUpperBoundChanged;

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
        yAxis.setUpperBound(5);
        yAxis.setTickUnit(1);

        setupYAxisContextMenu();
    }

    private void setupYAxisContextMenu() {
        ContextMenu menu = new ContextMenu();

        for (int value : List.of(5, 10, 15, 20)) {
            MenuItem item = new MenuItem(String.valueOf(value));
            item.setOnAction(e -> applyYAxisUpperBound(value));
            menu.getItems().add(item);
        }

        MenuItem custom = new MenuItem("Valeur personnalisée...");
        custom.setOnAction(e -> promptCustomYAxisUpperBound());
        menu.getItems().add(custom);

        chart.setOnContextMenuRequested(event ->
                menu.show(chart, event.getScreenX(), event.getScreenY())
        );
    }

    private void promptCustomYAxisUpperBound() {
        TextInputDialog dialog = new TextInputDialog(String.valueOf((int) yAxis.getUpperBound()));
        dialog.setTitle("Valeur personnalisée");
        dialog.setHeaderText(null);
        dialog.setContentText("Nombre maximal d'incidents par jour :");

        dialog.showAndWait().ifPresent(input -> {
            try {
                int value = Integer.parseInt(input.trim());
                if (value > 0) {
                    applyYAxisUpperBound(value);
                }
            } catch (NumberFormatException ignored) {
            }
        });
    }

    public void applyYAxisUpperBound(int upperBound) {
        yAxis.setUpperBound(upperBound);
        yAxis.setTickUnit(Math.max(1, upperBound / 4));

        if (onUpperBoundChanged != null) {
            onUpperBoundChanged.accept(upperBound);
        }
    }

    public void setOnUpperBoundChanged(IntConsumer onUpperBoundChanged) {
        this.onUpperBoundChanged = onUpperBoundChanged;
    }

    public void bind(List<IncidentPerDayViewModel> list) {
        chart.getData().clear();

        List<String> dates = list.stream()
                .map(vm -> vm.incidentPerDayProperty().dateTimeProperty().get().toLocalDate().toString())
                .distinct()
                .sorted()
                .toList();

        xAxis.setCategories(FXCollections.observableArrayList(dates));

        for (IncidentType type : IncidentType.values()) {

            XYChart.Series<String, Number> series = new XYChart.Series<>();
            series.setName(IncidentFormatting.format(type.toString()));
            String color = IncidentFormatting.colorHex(type);

            for (String date : dates) {
                long count = list.stream()
                        .filter(vm -> vm.incidentPerDayProperty().typeProperty().get() == type)
                        .filter(vm -> vm.incidentPerDayProperty().dateTimeProperty().get().toLocalDate().toString().equals(date))
                        .mapToLong(vm -> vm.incidentPerDayProperty().countProperty().get())
                        .sum();

                XYChart.Data<String, Number> data = new XYChart.Data<>(date, count);
                data.nodeProperty().addListener((obs, oldNode, newNode) -> {
                    if (newNode != null) {
                        newNode.setStyle("-fx-bar-fill: " + color + ";");
                    }
                });
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


