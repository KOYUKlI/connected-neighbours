package com.connectneighbours.admindesktop.ui.ui.features.incident.controller;

import com.connectneighbours.admindesktop.back.application.incident.CreationIncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.CreationAlertDTO;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import com.connectneighbours.admindesktop.back.application.statistics.IncidentAverageSolutionTimeDTO;
import com.connectneighbours.admindesktop.back.application.statistics.IncidentDistributionByTypeDTO;
import com.connectneighbours.admindesktop.back.application.statistics.IncidentPerDayByTypeDTO;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.infrastructure.preferences.UiPreferencesService;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.controller.AlertViewController;
import com.connectneighbours.admindesktop.ui.ui.features.alert.createalert.controller.CreateAlertController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.createincident.controller.CreateIncidentController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.controller.IncidentAverageSolutionTimeController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model.IncidentAverageSolutionTimeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.model.SimpleIncidentAverageSolutionTimeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentaveragesolutiontime.viewmodel.IncidentAverageSolutionTimeViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.controller.IncidentDistributionByTypeController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model.IncidentDistributionByTypeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.model.SimpleIncidentDistributionByTypeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentdistributionbytype.viewmodel.IncidentDistributionByTypeViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.controller.IncidentPerDayController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model.IncidentPerDayProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.model.SimpleIncidentPerDayProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidentgraph.incidentperday.viewmodel.IncidentPerDayViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.controller.IncidentTableController;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.ReadOnlyIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.model.SimpleIncidentTableProperty;
import com.connectneighbours.admindesktop.ui.ui.features.incident.incidenttable.viewmodel.IncidentTableViewModel;
import com.connectneighbours.admindesktop.ui.ui.features.incident.utils.IncidentFormatting;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.SimpleReporterProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuItem;
import javafx.scene.image.Image;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.io.IOException;
import java.util.List;
import java.util.function.Consumer;

public class IncidentViewController extends VBox {
    private AdminDesktopController parent;

    private IncidentTableController tableController;
    private IncidentPerDayController incidentPerDay;
    private IncidentDistributionByTypeController incidentDistribution;
    private IncidentAverageSolutionTimeController incidentAverageSolutionTime;

    private List<IncidentDTO> currentIncidents = List.of();
    private String selectedType = "Tous";
    private String selectedStatus = "Tous";
    private String selectedGravity = "Toutes";

    private int currentPage = 0;
    private int totalPages = 1;
    private static final int PAGE_SIZE = 10;

    @FXML
    private HBox graphIncident;

    @FXML
    private VBox container;

    @FXML
    private Button createIncident;
    @FXML
    private Button btnFilter;

    @FXML
    private Menu menuType;
    @FXML
    private MenuItem typeAll;
    @FXML
    private MenuItem typeSecurity;
    @FXML
    private MenuItem typeNuisance;
    @FXML
    private MenuItem typeCleanliness;
    @FXML
    private MenuItem typeMaintenance;
    @FXML
    private MenuItem typeTraffic;
    @FXML
    private MenuItem typeOther;
    @FXML
    private Label typeValue;

    @FXML
    private Menu menuStatus;
    @FXML
    private MenuItem statusAll;
    @FXML
    private MenuItem statusCreated;
    @FXML
    private MenuItem statusOpen;
    @FXML
    private MenuItem statusInProgress;
    @FXML
    private MenuItem statusResolved;
    @FXML
    private MenuItem statusClosed;
    @FXML
    private Label statusValue;

    @FXML
    private Menu menuGravity;
    @FXML
    private MenuItem gravityAll;
    @FXML
    private MenuItem gravityLow;
    @FXML
    private MenuItem gravityMedium;
    @FXML
    private MenuItem gravityHigh;
    @FXML
    private MenuItem gravityCritical;
    @FXML
    private Label gravityValue;

    @FXML
    private Button btnPrevPage;
    @FXML
    private Button btnNextPage;
    @FXML
    private Label pageNumberLabel;

    public IncidentViewController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/incident/view/incident-view.fxml"
        ));
        loader.setRoot(this);
        loader.setController(this);
        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @FXML
    public void initialize() {
        tableController = new IncidentTableController();
        tableController.setParent(this);

        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/incident/incidenttable/view/incident-table-view.fxml"
        ));
        loader.setRoot(tableController);
        loader.setController(tableController);

        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        container.getChildren().setAll(tableController);

        createIncident.setOnAction(e -> goToCreateIncident());
        btnFilter.setOnAction(e -> refreshFilter());
        btnPrevPage.setOnAction(e -> goToPage(currentPage - 1));
        btnNextPage.setOnAction(e -> goToPage(currentPage + 1));

        bindMenuItem(typeAll, typeValue, v -> selectedType = v);
        bindMenuItem(typeSecurity, typeValue, v -> selectedType = v);
        bindMenuItem(typeNuisance, typeValue, v -> selectedType = v);
        bindMenuItem(typeCleanliness, typeValue, v -> selectedType = v);
        bindMenuItem(typeMaintenance, typeValue, v -> selectedType = v);
        bindMenuItem(typeTraffic, typeValue, v -> selectedType = v);
        bindMenuItem(typeOther, typeValue, v -> selectedType = v);

        bindMenuItem(statusAll, statusValue, v -> selectedStatus = v);
        bindMenuItem(statusCreated, statusValue, v -> selectedStatus = v);
        bindMenuItem(statusOpen, statusValue, v -> selectedStatus = v);
        bindMenuItem(statusInProgress, statusValue, v -> selectedStatus = v);
        bindMenuItem(statusResolved, statusValue, v -> selectedStatus = v);
        bindMenuItem(statusClosed, statusValue, v -> selectedStatus = v);

        bindMenuItem(gravityAll, gravityValue, v -> selectedGravity = v);
        bindMenuItem(gravityLow, gravityValue, v -> selectedGravity = v);
        bindMenuItem(gravityMedium, gravityValue, v -> selectedGravity = v);
        bindMenuItem(gravityHigh, gravityValue, v -> selectedGravity = v);
        bindMenuItem(gravityCritical, gravityValue, v -> selectedGravity = v);
    }

    private void bindMenuItem(MenuItem item, Label target, Consumer<String> onSelect) {
        item.setOnAction(e -> {
            target.setText(item.getText());
            onSelect.accept(item.getText());
            persistIncidentFilters();
        });
    }

    private void persistIncidentFilters() {
        var service = getUiPreferencesService();
        var prefs = service.get();
        prefs.setIncidentType(selectedType);
        prefs.setIncidentStatus(selectedStatus);
        prefs.setIncidentGravity(selectedGravity);
        service.save(prefs);
    }

    private void restoreIncidentFilters() {
        var prefs = getUiPreferencesService().get();
        selectedType = prefs.getIncidentType();
        selectedStatus = prefs.getIncidentStatus();
        selectedGravity = prefs.getIncidentGravity();
        typeValue.setText(selectedType);
        statusValue.setText(selectedStatus);
        gravityValue.setText(selectedGravity);
    }

    private void refreshFilter() {
        var filtered = currentIncidents.stream()
                .filter(i -> selectedType.equals("Tous")
                        || IncidentFormatting.format(i.type().toString()).equalsIgnoreCase(selectedType))
                .filter(i -> selectedStatus.equals("Tous")
                        || IncidentFormatting.format(i.status().toString()).equalsIgnoreCase(selectedStatus))
                .filter(i -> selectedGravity.equals("Toutes")
                        || severityLabel(i.severity()).equalsIgnoreCase(selectedGravity))
                .toList();

        List<IncidentTableViewModel> models = filtered.stream()
                .map(dto -> {
                    var vm = new IncidentTableViewModel();
                    vm.setDto(dto);
                    vm.setIncidentTable(mapToProperty(dto));
                    return vm;
                })
                .toList();

        tableController.getIncidentTable().getItems().setAll(models);
    }

    private String severityLabel(IncidentSeverity severity) {
        return switch (severity) {
            case LOW -> "Mineure";
            case MEDIUM -> "Moyenne";
            case HIGH -> "Haute";
            case CRITICAL -> "Critique";
        };
    }

    public void goToCreateIncident() {
        CreateIncidentController createIncidentView = new CreateIncidentController();

        createIncidentView.setOnCancel(() -> parent.getMainContainer().getChildren().setAll(this));

        createIncidentView.setOnCreate(property -> {
            var reporter = getReporterManagement().getDefaultReporter();
            CreationIncidentDTO dto = new CreationIncidentDTO(
                    reporter,
                    property.titleProperty().get(),
                    property.descriptionProperty().get(),
                    property.typeProperty().get(),
                    property.severityProperty().get()
            );
            getIncidentManagement().createIncident(dto);
            loadIncidents(getIncidentManagement().listIncidents(PageRequest.of(0, PAGE_SIZE)));
            parent.getMainContainer().getChildren().setAll(this);
        });

        parent.getMainContainer().getChildren().setAll(createIncidentView);
    }

    public void goToAlerts(IncidentDTO incident) {
        AlertViewController alertView = new AlertViewController();
        alertView.setParent(this);
        alertView.loadIncident(incident);
        parent.getMainContainer().getChildren().setAll(alertView);
    }

    public void goToCreateAlert(AlertViewController previous, IncidentDTO incident) {
        CreateAlertController createAlertView = new CreateAlertController();

        createAlertView.setOnCancel(() -> parent.getMainContainer().getChildren().setAll(previous));

        createAlertView.setOnCreate(property -> {
            CreationAlertDTO dto = new CreationAlertDTO(
                    incident.reporter(),
                    property.titleProperty().get(),
                    property.descriptionProperty().get(),
                    property.severityProperty().get()
            );
            getAlertManagement().addAlertToIncident(incident.id(), dto);
            previous.loadIncident(getIncidentManagement().getIncident(incident.id()));
            parent.getMainContainer().getChildren().setAll(previous);
        });

        parent.getMainContainer().getChildren().setAll(createAlertView);
    }

    public void updateAverageSolutionTimeGraph() {
        var average = getStatisticsManagement().listIncidentAverageSolutionTime(7)
                .stream().map(this::toIncidentAverageSolutionTimeProperty).toList();


        var viewModels = average.stream()
                .map(incidentAverageSolutionTime::toIncidentAverageSolutionTimeViewModel)
                .toList();

        incidentAverageSolutionTime.bind(viewModels);
    }

    private void goToPage(int page) {
        loadIncidents(getIncidentManagement().listIncidents(PageRequest.of(page, PAGE_SIZE)));
    }

    private void updatePaginationControls() {
        pageNumberLabel.setText(String.valueOf(currentPage));
        btnPrevPage.setDisable(currentPage <= 0);
        btnNextPage.setDisable(currentPage >= totalPages - 1);
    }

    public void loadIncidents(Page<IncidentDTO> page) {
        currentPage = page.getNumber();
        totalPages = Math.max(page.getTotalPages(), 1);
        updatePaginationControls();

        List<IncidentDTO> incidents = page.getContent();
        currentIncidents = incidents;

        refreshFilter();

        List<IncidentPerDayByTypeDTO> incidentPerDayByTypeDTOList = getStatisticsManagement().listIncidentPerDayByType(7);

        List<IncidentPerDayProperty> incidentPerDayProperties = incidentPerDayByTypeDTOList.stream()
                .map(this::toIncidentPerDayProperty)
                .toList();

        loadIncidentPerDay(incidentPerDayProperties);

        List<IncidentDistributionByTypeDTO> distributionList = getStatisticsManagement().listIncidentDistributedByType();

        List<IncidentDistributionByTypeProperty> properties = distributionList.stream()
                .map(this::toIncidentDistributionByTypeProperty)
                .toList();

        loadIncidentDistribution(properties);

        List<IncidentAverageSolutionTimeDTO> averageSolutionTimeList = getStatisticsManagement().listIncidentAverageSolutionTime(7);

        List<IncidentAverageSolutionTimeProperty> averageSolutionTimeProperties = averageSolutionTimeList.stream()
                .map(this::toIncidentAverageSolutionTimeProperty)
                .toList();

        loadIncidentAverageSolutionTime(averageSolutionTimeProperties);
    }

    public void loadIncidentDistribution(List<IncidentDistributionByTypeProperty> list) {
        if (incidentDistribution == null) {
            incidentDistribution = new IncidentDistributionByTypeController();
            incidentDistribution.setPrefWidth(250);
            incidentDistribution.setMaxWidth(250);
            graphIncident.getChildren().add(incidentDistribution);
        }

        List<IncidentDistributionByTypeViewModel> viewModelList = list.stream()
                .map(incidentDistribution::toIncidentDistributionByTypeViewModel)
                .toList();

        incidentDistribution.bindGraph(viewModelList);
    }

    public void loadIncidentPerDay(List<IncidentPerDayProperty> list) {
        if (incidentPerDay == null) {
            incidentPerDay = new IncidentPerDayController();
            incidentPerDay.applyYAxisUpperBound(getUiPreferencesService().get().getIncidentPerDayYAxisUpperBound());
            incidentPerDay.setOnUpperBoundChanged(bound -> {
                var prefs = getUiPreferencesService().get();
                prefs.setIncidentPerDayYAxisUpperBound(bound);
                getUiPreferencesService().save(prefs);
            });
            graphIncident.getChildren().addFirst(incidentPerDay);
        }

        List<IncidentPerDayViewModel> viewModelList = list.stream()
                .map(incidentPerDay::toIncidentPerDayViewModel)
                .toList();

        incidentPerDay.bind(viewModelList);
    }


    public void loadIncidentAverageSolutionTime(List<IncidentAverageSolutionTimeProperty> list) {
        if (incidentAverageSolutionTime == null) {
            incidentAverageSolutionTime = new IncidentAverageSolutionTimeController();

            var prefs = getUiPreferencesService().get();
            incidentAverageSolutionTime.applyYAxisUpperBound(prefs.getAverageSolutionTimeYAxisUpperBound());
            incidentAverageSolutionTime.setTimeUnit(prefs.getAverageSolutionTimeUnit());

            incidentAverageSolutionTime.setOnUpperBoundChanged(bound -> {
                var p = getUiPreferencesService().get();
                p.setAverageSolutionTimeYAxisUpperBound(bound);
                getUiPreferencesService().save(p);
            });
            incidentAverageSolutionTime.setOnTimeUnitChanged(unit -> {
                var p = getUiPreferencesService().get();
                p.setAverageSolutionTimeUnit(unit);
                getUiPreferencesService().save(p);
            });

            graphIncident.getChildren().addLast(incidentAverageSolutionTime);
        }

        List<IncidentAverageSolutionTimeViewModel> viewModelList = list.stream()
                .map(incidentAverageSolutionTime::toIncidentAverageSolutionTimeViewModel)
                .toList();

        incidentAverageSolutionTime.bind(viewModelList);
    }

    private ReadOnlyIncidentTableProperty mapToProperty(IncidentDTO dto) {
        SimpleIncidentTableProperty p = new SimpleIncidentTableProperty();
        p.incidentIdProperty().set(dto.displayId());
        p.titleProperty().set(dto.title());
        p.typeProperty().set(dto.type().toString());
        p.statusProperty().set(dto.status().toString());
        p.createdAtProperty().set(dto.createdAt());
        p.resolvedAtProperty().set(dto.resolvedAt());
        p.alertsCountProperty().set(dto.alerts().size());
        p.reporterProperty().set((ReporterProperty) mapReporter(dto.reporter()));
        p.severityProperty().set(dto.severity().toString());
        return p;
    }

    private ReadOnlyReporterProperty mapReporter(ReporterDTO dto) {
        SimpleReporterProperty p = new SimpleReporterProperty();
        p.firstnameProperty().set(dto.firstname());
        p.lastnameProperty().set(dto.lastname());
        p.avatarProperty().set(new Image(dto.avatarPath()));
        return p;
    }


    private IncidentDistributionByTypeProperty toIncidentDistributionByTypeProperty(IncidentDistributionByTypeDTO dto) {
        SimpleIncidentDistributionByTypeProperty p = new SimpleIncidentDistributionByTypeProperty();
        p.countProperty().set(dto.count());
        p.rateProperty().set(dto.rate());
        p.percentageProperty().set(dto.percentage());
        p.typeProperty().set(dto.type());
        return p;
    }

    private IncidentPerDayProperty toIncidentPerDayProperty(IncidentPerDayByTypeDTO dto) {
        SimpleIncidentPerDayProperty p = new SimpleIncidentPerDayProperty();
        p.countProperty().set(dto.count());
        p.typeProperty().set(dto.type());
        p.dateTimeProperty().set(dto.dateTime());
        return p;
    }

    private IncidentAverageSolutionTimeProperty toIncidentAverageSolutionTimeProperty(IncidentAverageSolutionTimeDTO dto) {
        SimpleIncidentAverageSolutionTimeProperty p = new SimpleIncidentAverageSolutionTimeProperty();
        p.countProperty().set(dto.count());
        p.durationProperty().set(dto.duration());
        p.dateTimeProperty().set(dto.dateTime());
        return p;
    }




    public AlertManagement getAlertManagement() {
        return parent.getAlertManagement();
    }

    public StatisticsManagement getStatisticsManagement() {
        return parent.getStatisticsManagement();
    }

    public IncidentManagement getIncidentManagement() {
        return parent.getIncidentManagement();
    }

    public ReporterManagement getReporterManagement() {
        return parent.getReporterManagement();
    }

    public UiPreferencesService getUiPreferencesService() {
        return parent.getUiPreferencesService();
    }

    public void goBackToIncidents() {
        parent.showHome();
    }

    public void setParent(AdminDesktopController parent) {
        this.parent = parent;
        restoreIncidentFilters();
    }
}

