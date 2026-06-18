package com.connectneighbours.admindesktop.back.application.statistics;

import com.connectneighbours.admindesktop.back.domain.statistics.IncidentCountByPeriod;
import com.connectneighbours.admindesktop.back.domain.statistics.IncidentDistributionByType;
import com.connectneighbours.admindesktop.back.domain.statistics.ReporterActivity;
import com.connectneighbours.admindesktop.back.domain.statistics.ResolutionRate;

public class StatisticsMapper {
    public static IncidentCountByPeriodDTO toIncidentCountByPeriodDTO(IncidentCountByPeriod incidentCountByPeriod) {
        return new IncidentCountByPeriodDTO(incidentCountByPeriod.start(), incidentCountByPeriod.end(), incidentCountByPeriod.count());
    }

    public static ResolutionRateDTO toResolutionRateDTO(ResolutionRate resolutionRate) {
        return new ResolutionRateDTO(FormatPercentage.formatPercentage(resolutionRate.rate()), resolutionRate.resolved(), resolutionRate.total());
    }

    public static ReporterActivityDTO toReporterActivityDTO(ReporterActivity reporterActivity) {
        return new ReporterActivityDTO(reporterActivity.idReporter(), reporterActivity.firstname(), reporterActivity.lastname(), reporterActivity.incidentCount(), reporterActivity.alertCount());
    }

    public static IncidentDistributionByTypeDTO toIncidentDistributionByTypeDTO(IncidentDistributionByType incidentDistributionByType) {
        return new IncidentDistributionByTypeDTO(incidentDistributionByType.type(), incidentDistributionByType.count(), FormatPercentage.formatPercentage(incidentDistributionByType.rate()));
    }
}
