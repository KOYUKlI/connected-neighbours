package com.connectneighbours.admindesktop.back.infrastructure.statistics;

import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.exception.incident.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import com.connectneighbours.admindesktop.back.domain.statistics.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
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
                    return new ReporterActivity(r.getIdReporter(), r.getFirstname(), r.getLastname(), r.getRole(), (long) countIncidentList, (long) countAlertList);
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
    public AlertDistributionBySeverity alertDistributionBySeverity(AlertSeverity severity) {
        var list = alertRepository.findAll();
        var total = list.size();
        var count = list.stream()
                .filter(alert -> alert.getSeverity().equals(severity))
                .count();
        return new AlertDistributionBySeverity(severity, count, Double.isNaN((double) count / total) ? 0.0 : (double) count / total);
    }

    @Override
    public List<AlertDistributionBySeverity> listAlertDistributionBySeverity() {
        return Arrays.stream(AlertSeverity.values())
                .map(this::alertDistributionBySeverity)
                .toList();
    }

    @Override
    public List<AlertDistributionBySeverity> listAlertDistributionBySeverityAndIncident(UUID incident) {
        var incidentFind = incidentRepository.findById(incident)
                .orElseThrow(() -> new IncidentNotFoundException("Incident not found with UUID : " + incident));

        var alerts = incidentFind.getAlerts();
        long total = alerts.size();

        return Arrays.stream(AlertSeverity.values())
                .map(sev -> {
                    long count = alerts.stream().filter(a -> a.getSeverity().equals(sev)).count();
                    double rate = total == 0 ? 0 : (double) count / total;
                    return new AlertDistributionBySeverity(sev, count, rate);
                })
                .toList();
    }


    @Override
    public IncidentPerDayByType incidentPerDayByType(IncidentType type) {
        var count = incidentRepository.countByTypeAndCreatedAtBetween(type, LocalDateTime.now(), LocalDateTime.now().plusDays(1));
        return new IncidentPerDayByType(count, type, LocalDateTime.now());
    }

    @Override
    public List<IncidentPerDayByType> listIncidentPerDayByType(int days) {
        var start = LocalDate.now().minusDays(days);
        var end = LocalDate.now();

        return incidentRepository.findAll().stream()
                .filter(i -> {
                    LocalDate d = i.getCreatedAt().toLocalDate();
                    return !d.isBefore(start) && !d.isAfter(end);
                })
                .collect(Collectors.groupingBy(i -> i.getCreatedAt().toLocalDate()))
                .entrySet().stream()
                .flatMap(e -> Arrays.stream(IncidentType.values())
                        .map(t -> new IncidentPerDayByType(
                                e.getValue().stream().filter(i -> i.getType() == t).count(),
                                t,
                                e.getKey().atStartOfDay()
                        ))
                )
                .sorted(Comparator.comparing(IncidentPerDayByType::dateTime))
                .toList();
    }


    @Override
    public IncidentAverageSolutionTime incidentAverageSolutionTime() {

        var incidentsToday = incidentRepository.findAll().stream()
                .filter(i -> i.getResolvedAt() != null)
                .filter(i -> i.getResolvedAt().toLocalDate().equals(LocalDate.now()))
                .toList();

        long count = incidentsToday.size();

        long totalMinutes = incidentsToday.stream()
                .mapToLong(i -> Duration.between(i.getCreatedAt(), i.getResolvedAt()).toMinutes())
                .sum();

        long averageMinutes = count == 0 ? 0 : totalMinutes / count;

        return new IncidentAverageSolutionTime(
                count,
                LocalDateTime.now(),
                averageMinutes
        );
    }


    @Override
    public List<IncidentAverageSolutionTime> listIncidentAverageSolutionTime(int days) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(days - 1);


        var incidents = incidentRepository.findAll().stream()
                .filter(i -> i.getResolvedAt() != null)
                .toList();

        List<IncidentAverageSolutionTime> result = new ArrayList<>();

        for (int d = 0; d < days; d++) {
            LocalDate targetDay = start.plusDays(d);

            var incidentsOfDay = incidents.stream()
                    .filter(i -> i.getResolvedAt().toLocalDate().equals(targetDay))
                    .toList();

            long count = incidentsOfDay.size();

            long totalMinutes = incidentsOfDay.stream()
                    .mapToLong(i -> Duration.between(i.getCreatedAt(), i.getResolvedAt()).toMinutes())
                    .sum();


            long averageMinutes = count == 0 ? 0 : totalMinutes / count;

            result.add(new IncidentAverageSolutionTime(
                    count,
                    targetDay.atStartOfDay(),
                    averageMinutes
            ));
        }

        return result;
    }

}
