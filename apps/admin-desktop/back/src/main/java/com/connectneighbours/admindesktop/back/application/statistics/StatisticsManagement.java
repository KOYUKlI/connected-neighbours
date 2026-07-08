package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.statistics.StatisticsService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StatisticsManagement {
    private final StatisticsService service;

    public StatisticsManagement(StatisticsService service) {
        this.service = service;
    }

    public IncidentCountByPeriodDTO countIncidents(LocalDate start, LocalDate end) {
        var incidentCountByPeriod = service.countIncidents(start, end);
        return StatisticsMapper.toIncidentCountByPeriodDTO(incidentCountByPeriod);
    }

    public ResolutionRateDTO resolutionRate() {
        var resolutionRate = service.resolutionRate();
        return StatisticsMapper.toResolutionRateDTO(resolutionRate);
    }

    public List<ReporterActivityDTO> reporterActivity() {
        return service.reporterActivity().stream()
                .map(StatisticsMapper::toReporterActivityDTO)
                .toList();
    }

    public IncidentDistributionByTypeDTO incidentCountByPeriod(IncidentType type) {
        var incidentDistributionByType = service.incidentDistributionByType(type);
        return StatisticsMapper.toIncidentDistributionByTypeDTO(incidentDistributionByType);
    }

    public List<IncidentDistributionByTypeDTO> listIncidentDistributedByType() {
        return service.listIncidentDistributedByType().stream()
                .map(StatisticsMapper::toIncidentDistributionByTypeDTO)
                .toList();
    }

    public AlertDistributionBySeverityDTO alertDistributionBySeverity(AlertSeverity severity) {
        var alertDistributionBySeverity = service.alertDistributionBySeverity(severity);
        return StatisticsMapper.toAlertDistributionBySeverityDTO(alertDistributionBySeverity);
    }

    public List<AlertDistributionBySeverityDTO> listAlertDistributionBySeverity() {
        return service.listAlertDistributionBySeverity().stream()
                .map(StatisticsMapper::toAlertDistributionBySeverityDTO)
                .toList();
    }

    public List<AlertDistributionBySeverityDTO> listAlertDistributionBySeverityAndIncident(IncidentDTO incidentDTO) {
        return service.listAlertDistributionBySeverityAndIncident(incidentDTO.id()).stream()
                .map(StatisticsMapper::toAlertDistributionBySeverityDTO)
                .toList();
    }
}
