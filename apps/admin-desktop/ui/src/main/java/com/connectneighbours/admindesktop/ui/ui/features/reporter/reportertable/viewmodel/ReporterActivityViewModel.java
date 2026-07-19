package com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.viewmodel;

import com.connectneighbours.admindesktop.back.application.statistics.ReporterActivityDTO;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.model.ReadOnlyReporterActivityProperty;
import com.connectneighbours.admindesktop.ui.ui.features.reporter.reportertable.model.SimpleReporterActivityProperty;

public class ReporterActivityViewModel {
    private final SimpleReporterActivityProperty reporterActivity = new SimpleReporterActivityProperty();

    private ReporterActivityDTO dto;

    public ReporterActivityDTO getDto() {
        return dto;
    }

    public void setDto(ReporterActivityDTO dto) {
        this.dto = dto;
    }

    public ReadOnlyReporterActivityProperty reporterActivityProperty() {
        return reporterActivity;
    }

    public void setReporterActivity(ReadOnlyReporterActivityProperty source) {
        if (source == null) {
            reporterActivity.fullNameProperty().set("");
            reporterActivity.roleProperty().set("");
            reporterActivity.incidentCountProperty().set(0);
            reporterActivity.alertCountProperty().set(0);
            return;
        }

        reporterActivity.fullNameProperty().set(source.fullNameProperty().get());
        reporterActivity.roleProperty().set(source.roleProperty().get());
        reporterActivity.incidentCountProperty().set(source.incidentCountProperty().get());
        reporterActivity.alertCountProperty().set(source.alertCountProperty().get());
    }
}
