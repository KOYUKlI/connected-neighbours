package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterDTO;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginAlreadyExistException;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

public class PluginContext {
    private final String pluginName;
    private final List<IncidentDTO> incidentDTOList;
    private final List<AlertDTO> alertDTOList;
    private final List<ReporterDTO> reporterDTOList;
    private final LoggerPlugin loggerPlugin = new LoggerPlugin();

    public PluginContext(String pluginName, List<IncidentDTO> incidentDTOList, List<AlertDTO> alertDTOList, List<ReporterDTO> reporterDTOList) {
        this.pluginName = pluginName;
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

    public void saveFile(String fileName, byte[] content) {
        if(fileName  == null || fileName .isBlank()) throw new IllegalArgumentException("fileName cannot be empty or null");

        try {
            var pluginDir = new File("/plugins/output/"+ pluginName);

            if(!pluginDir.exists()) pluginDir.mkdirs();

            var pluginFile = new File(pluginDir.getPath(), fileName );

            if(pluginFile.exists()){
                var message = "File already exist : " +fileName;
                loggerPlugin.error(message);
                throw new PluginAlreadyExistException(message);
            }

            try (FileOutputStream fos = new FileOutputStream(pluginFile)) {
                fos.write(content);
            }

            loggerPlugin.info("File saved " + fileName);

        } catch (IOException e) {
            loggerPlugin.error(e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
