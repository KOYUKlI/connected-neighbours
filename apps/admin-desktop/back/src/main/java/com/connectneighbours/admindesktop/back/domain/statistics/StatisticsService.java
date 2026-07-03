package com.connectneighbours.admindesktop.back.domain.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

import java.time.LocalDate;
import java.util.List;

public interface StatisticsService {
    IncidentCountByPeriod countIncidents(LocalDate start, LocalDate end);

    ResolutionRate resolutionRate();

    List<ReporterActivity> reporterActivity();

    IncidentDistributionByType incidentDistributionByType(IncidentType type);

    List<IncidentDistributionByType> listIncidentDistributedByType();

    AlertDistributionBySeverity alertDistributionBySeverity(AlertSeverity severity);

    List<AlertDistributionBySeverity> listAlertDistributionBySeverity();
}
