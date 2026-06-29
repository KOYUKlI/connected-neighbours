package com.connectneighbours.admindesktop.back.infrastructure.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import com.connectneighbours.admindesktop.back.domain.statistics.*;
import org.springframework.stereotype.Repository;

import java.lang.reflect.Array;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import static java.lang.Double.NaN;

@Repository
public class StatisticsServiceImpl implements StatisticsService {
    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final ReporterRepository reporterRepository;

    public StatisticsServiceImpl(IncidentRepository incidentRepository, AlertRepository alertRepository, ReporterRepository reporterRepository) {
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
        this.reporterRepository = reporterRepository;
    }

    @Override
    public IncidentCountByPeriod countIncidents(LocalDate start, LocalDate end) {
        var startTime = start.atStartOfDay();
        var endTime = end.atTime(LocalTime.MAX);

        var count = (long) incidentRepository.findByCreatedAtBetween(startTime, endTime).size();

        return new IncidentCountByPeriod(start, end, count);
    }

    @Override
    public ResolutionRate resolutionRate() {
        var totalIncidents = incidentRepository.findAll().size();
        if (totalIncidents == 0) {
            return new ResolutionRate(0.0, 0L, 0L);
        }

        var resolvedIncident = incidentRepository.findByStatus(IncidentStatus.RESOLVED).size();
        return new ResolutionRate((double) resolvedIncident / totalIncidents, (long) resolvedIncident, (long) totalIncidents);
    }

    @Override
    public List<ReporterActivity> reporterActivity() {
        return reporterRepository.findAll().stream()
                .map(r -> {
                    var countIncidentList = incidentRepository.findByReporter(r).size();
                    var countAlertList = alertRepository.findByReporter(r).size();
                    return new ReporterActivity(r.getIdReporter(), r.getFirstname(), r.getLastname(), (long) countIncidentList, (long) countAlertList);
                })
                .toList();
    }

    @Override
    public IncidentDistributionByType incidentDistributionByType(IncidentType type) {
        var list = incidentRepository.findAll();
        var total = list.size();
        var count = list.stream()
                .filter(incident -> incident.getType().equals(type))
                .count();
        return new IncidentDistributionByType(type, count, Double.isNaN((double) count / total) ? 0.0 : (double) count / total);
    }

    @Override
    public List<IncidentDistributionByType> listIncidentDistributedByType() {
        return Arrays.stream(IncidentType.values())
                .map(this::incidentDistributionByType)
                .toList();
    }

    @Override
    public AlertDistributionBySeverity alertDistributionBySeverity(Severity severity) {
        var list = alertRepository.findAll();
        var total = list.size();
        var count = list.stream()
                .filter(alert -> alert.getSeverity().equals(severity))
                .count();
        return new AlertDistributionBySeverity(severity,count, Double.isNaN((double) count/total) ? 0.0 : (double) count/total);
    }

    @Override
    public List<AlertDistributionBySeverity> listAlertDistributionBySeverity() {
        return Arrays.stream(Severity.values())
                .map(this::alertDistributionBySeverity)
                .toList();
    }
}
