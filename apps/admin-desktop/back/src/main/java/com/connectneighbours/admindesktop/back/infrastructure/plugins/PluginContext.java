package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;

import java.io.File;
import java.io.IOException;
import java.util.List;

public class PluginContext {
    private final List<IncidentDTO> incidentDTOList;
    private final List<AlertDTO> alertDTOList;
    private final List<ReporterDTO> reporterDTOList;
    private final LoggerPlugin loggerPlugin = new LoggerPlugin();

    public PluginContext(List<IncidentDTO> incidentDTOList, List<AlertDTO> alertDTOList, List<ReporterDTO> reporterDTOList) {
        this.incidentDTOList = incidentDTOList;
        this.alertDTOList = alertDTOList;
        this.reporterDTOList = reporterDTOList;
    }

    public List<IncidentDTO> getIncidentDTOList() {
        return incidentDTOList;
    }

    public List<AlertDTO> getAlertDTOList() {
        return alertDTOList;
    }

    public List<ReporterDTO> getReporterDTOList() {
        return reporterDTOList;
    }

    public LoggerPlugin getLoggerPlugin() {
        return loggerPlugin;
    }

    public void log(String message) {
        loggerPlugin.info(message);
    }

    public void saveFile(String name) {
        var pathSavePlugin = new File("/plugins/output/");
        var savedPlugin = new File(pathSavePlugin.getPath() + name);
        if(!savedPlugin.exists()) {

        }
    }

    public void export(){}
}
