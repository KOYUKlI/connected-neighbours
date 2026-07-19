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
import javafx.scene.control.ContextMenu;
import javafx.scene.control.MenuItem;
import javafx.scene.control.RadioMenuItem;
import javafx.scene.control.SeparatorMenuItem;
import javafx.scene.control.TextInputDialog;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.VBox;

import java.io.IOException;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.IntConsumer;

public class IncidentAverageSolutionTimeController extends VBox {

    private enum TimeUnit {
        MINUTES("Temps moyen (minutes)", "minutes"),
        HOURS("Temps moyen (heures)", "heures");

        private final String seriesLabel;
        private final String unitLabel;

        TimeUnit(String seriesLabel, String unitLabel) {
            this.seriesLabel = seriesLabel;
            this.unitLabel = unitLabel;
        }
    }

    @FXML private  AreaChart<String,Number> areaChart;
    @FXML private CategoryAxis xAxis;
    @FXML private NumberAxis yAxis;

    private TimeUnit currentUnit = TimeUnit.HOURS;
    private List<IncidentAverageSolutionTimeViewModel> currentList = List.of();
    private IntConsumer onUpperBoundChanged;
    private Consumer<String> onTimeUnitChanged;
    private RadioMenuItem minutesItem;
    private RadioMenuItem hoursItem;

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

        yAxis.setAutoRanging(false);
        yAxis.setUpperBound(200);
        yAxis.setTickUnit(50);

        setupYAxisContextMenu();
    }

    private void setupYAxisContextMenu() {
        ContextMenu menu = new ContextMenu();

        for (int value : List.of(50, 100, 200, 500)) {
            MenuItem item = new MenuItem(String.valueOf(value));
            item.setOnAction(e -> applyYAxisUpperBound(value));
            menu.getItems().add(item);
        }

        MenuItem custom = new MenuItem("Valeur personnalisée...");
        custom.setOnAction(e -> promptCustomYAxisUpperBound());
        menu.getItems().add(custom);

        menu.getItems().add(new SeparatorMenuItem());

        ToggleGroup unitGroup = new ToggleGroup();

        minutesItem = new RadioMenuItem("Minutes");
        minutesItem.setToggleGroup(unitGroup);
        minutesItem.setSelected(currentUnit == TimeUnit.MINUTES);
        minutesItem.setOnAction(e -> applyTimeUnit(TimeUnit.MINUTES));

        hoursItem = new RadioMenuItem("Heures");
        hoursItem.setToggleGroup(unitGroup);
        hoursItem.setSelected(currentUnit == TimeUnit.HOURS);
        hoursItem.setOnAction(e -> applyTimeUnit(TimeUnit.HOURS));

        menu.getItems().addAll(minutesItem, hoursItem);

        areaChart.setOnContextMenuRequested(event ->
                menu.show(areaChart, event.getScreenX(), event.getScreenY())
        );
    }

    private void applyTimeUnit(TimeUnit unit) {
        currentUnit = unit;
        renderChart();

        if (minutesItem != null) {
            minutesItem.setSelected(unit == TimeUnit.MINUTES);
            hoursItem.setSelected(unit == TimeUnit.HOURS);
        }

        if (onTimeUnitChanged != null) {
            onTimeUnitChanged.accept(unit.name());
        }
    }

    public void setTimeUnit(String unit) {
        applyTimeUnit(TimeUnit.valueOf(unit));
    }

    public void setOnTimeUnitChanged(Consumer<String> onTimeUnitChanged) {
        this.onTimeUnitChanged = onTimeUnitChanged;
    }

    private void promptCustomYAxisUpperBound() {
        TextInputDialog dialog = new TextInputDialog(String.valueOf((int) yAxis.getUpperBound()));
        dialog.setTitle("Valeur personnalisée");
        dialog.setHeaderText(null);
        dialog.setContentText("Temps moyen de résolution maximal (" + currentUnit.unitLabel + ") :");

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

    public void bind(List<IncidentAverageSolutionTimeViewModel> list) {
        currentList = list;
        renderChart();
    }

    private void renderChart() {

        List<String> dates = currentList.stream()
                .map(vm -> vm.incidentAverageSolutionTimeProperty().dateTimeProperty().get().toLocalDate().toString())
                .distinct()
                .sorted()
                .toList();

        xAxis.setCategories(FXCollections.observableArrayList(dates));

        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName(currentUnit.seriesLabel);

        for (String date : dates) {
            var vm = currentList.stream()
                    .filter(v -> v.incidentAverageSolutionTimeProperty().dateTimeProperty().get().toLocalDate().toString().equals(date))
                    .findFirst()
                    .orElse(null);

            if (vm != null) {
                long avgMinutes = vm.incidentAverageSolutionTimeProperty().durationProperty().get();
                double value = currentUnit == TimeUnit.HOURS
                        ? Math.round((avgMinutes / 60.0) * 100) / 100.0
                        : avgMinutes;
                series.getData().add(new XYChart.Data<>(date, value));
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
