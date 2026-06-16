package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import com.connectneighbours.admindesktop.back.application.statistics.StatisticsManagement;

import java.util.UUID;

public class PluginManagement {
    private IncidentManagement incidentManagement;
    private AlertManagement alertManagement;
    private ReporterManagement reporterManagement;
    private StatisticsManagement statisticsManagement;
    private PluginRepository pluginRepository;

    public PluginManagement(IncidentManagement incidentManagement, AlertManagement alertManagement, ReporterManagement reporterManagement, StatisticsManagement statisticsManagement) {
        this.incidentManagement = incidentManagement;
        this.alertManagement = alertManagement;
        this.reporterManagement = reporterManagement;
        this.statisticsManagement = statisticsManagement;
    }

    public PluginDTO load() {
        var plugin = pluginRepository.save();
        return new PluginDTO("","","","","","",StatePlugin.ACTIVATE);
    }

    public PluginDTO execute(UUID uuid) {
        var plugin = pluginRepository.findById(uuid);
        return new PluginDTO("","","","","","",StatePlugin.RUNNING);
    }

    public PluginDTO deactivate() {
        return new PluginDTO("","","","","","",StatePlugin.DEACTIVATE);
    }

    public void delete(UUID uuid) {
        pluginRepository.delete(uuid);
    }
}
