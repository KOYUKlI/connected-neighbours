package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;

public class PluginManagement {
    private IncidentManagement incidentManagement;
    private AlertManagement alertManagement;
    private ReporterManagement reporterManagement;
    private StatisticsManagement statisticsManagement;

    public PluginManagement(IncidentManagement incidentManagement, AlertManagement alertManagement, ReporterManagement reporterManagement, StatisticsManagement statisticsManagement) {
        this.incidentManagement = incidentManagement;
        this.alertManagement = alertManagement;
        this.reporterManagement = reporterManagement;
        this.statisticsManagement = statisticsManagement;
    }

}
