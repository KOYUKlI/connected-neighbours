package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import java.util.UUID;

public class PluginManagement {
    private final PluginRepository pluginRepository;
    private final PluginLoader pluginLoader;
    private final IncidentManagement incidentManagement;
    private final AlertManagement alertManagement;
    private final ReporterManagement reporterManagement;

    private PluginContext lastContext;

    public PluginManagement(PluginRepository pluginRepository, PluginLoader pluginLoader,
                             IncidentManagement incidentManagement, AlertManagement alertManagement,
                             ReporterManagement reporterManagement) {
        this.pluginRepository = pluginRepository;
        this.pluginLoader = pluginLoader;
        this.incidentManagement = incidentManagement;
        this.alertManagement = alertManagement;
        this.reporterManagement = reporterManagement;
    }

    public PluginDTO install(File jarFile) {
        var pluginInstalled = pluginLoader.installJar(jarFile);
        var pluginMetaData = pluginLoader.inspect(pluginInstalled);
        var dto = new PluginDTO(UUID.nameUUIDFromBytes(pluginMetaData.name().getBytes()), pluginMetaData.name(), pluginMetaData.version(), pluginMetaData.author(), pluginMetaData.description(), pluginInstalled.getPath(), pluginMetaData.main(), StatePlugin.ACTIVATE);
        return pluginRepository.save(dto);
    }

    public PluginDTO load(UUID uuid) throws IOException, ClassNotFoundException, InvocationTargetException, NoSuchMethodException, InstantiationException, IllegalAccessException {
        var plugin = pluginRepository.findById(uuid).orElseThrow(() -> new PluginNotFoundException("Plugin not found with UUID : " + uuid));
        pluginLoader.load(new File(plugin.path()));
        var dto = new PluginDTO(plugin.uuid(), plugin.name(), plugin.version(), plugin.author(), plugin.description(), plugin.path(), plugin.mainClass(), StatePlugin.ACTIVATE);
        return pluginRepository.save(dto);
    }

    public PluginDTO execute(UUID uuid) throws IOException, ClassNotFoundException, InvocationTargetException, NoSuchMethodException, InstantiationException, IllegalAccessException {
        var pluginDto = pluginRepository.findById(uuid).orElseThrow(() -> new PluginNotFoundException("Plugin not found with UUID : " + uuid));

        if (pluginDto.statePlugin() == StatePlugin.DEACTIVATE) {
            throw new IllegalStateException("Cannot execute a deactivated plugin");
        }


        var plugin = pluginLoader.load(new File(pluginDto.path()));
        var running = new PluginDTO(pluginDto.uuid(), pluginDto.name(), pluginDto.version(), pluginDto.author(), pluginDto.description(), pluginDto.path(), pluginDto.mainClass(), StatePlugin.RUNNING);
        pluginRepository.save(running);

        lastContext = buildContext(pluginDto.name());
        plugin.execute(lastContext);

        var finished = new PluginDTO(pluginDto.uuid(), pluginDto.name(), pluginDto.version(), pluginDto.author(), pluginDto.description(), pluginDto.path(), pluginDto.mainClass(), StatePlugin.ACTIVATE);
        return pluginRepository.save(finished);
    }

    public PluginDTO deactivate(UUID uuid) {
        var pluginDto = pluginRepository.findById(uuid).orElseThrow(() -> new PluginNotFoundException("Plugin not found with UUID : " + uuid));
        var dto = new PluginDTO(pluginDto.uuid(), pluginDto.name(), pluginDto.version(), pluginDto.author(), pluginDto.description(), pluginDto.path(), pluginDto.mainClass(), StatePlugin.DEACTIVATE);
        return pluginRepository.save(dto);
    }

    public void delete(UUID uuid) {
        pluginRepository.delete(uuid);
    }

    public List<PluginDTO> listPlugins() {
        return pluginRepository.findAll();
    }

    public List<String> getLogs() {
        return lastContext == null ? List.of() : lastContext.getLoggerPlugin().getLogs();
    }

    private PluginContext buildContext(String pluginName) {
        var incidents = incidentManagement.listIncidents(0, Integer.MAX_VALUE);
        var alerts = alertManagement.listAlerts();
        var reporters = reporterManagement.listReporters();
        return new PluginContext(pluginName, incidents, alerts, reporters);
    }
}
