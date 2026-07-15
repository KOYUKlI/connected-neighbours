package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PluginConfig {

    @Bean
    public PluginRepository pluginRepository() {
        return new PluginRepositoryFileImpl();
    }

    @Bean
    public PluginLoader pluginLoader() {
        return new PluginLoader();
    }

    @Bean
    public PluginManagement pluginManagement(PluginRepository pluginRepository, PluginLoader pluginLoader,
                                              IncidentManagement incidentManagement, AlertManagement alertManagement,
                                              ReporterManagement reporterManagement) {
        return new PluginManagement(pluginRepository, pluginLoader, incidentManagement, alertManagement, reporterManagement);
    }
}
