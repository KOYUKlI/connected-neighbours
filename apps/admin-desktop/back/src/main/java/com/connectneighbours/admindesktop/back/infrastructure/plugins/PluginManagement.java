package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.UUID;

public class PluginManagement {
    private final PluginRepository pluginRepository;
    private final PluginContext pluginContext;
    private final PluginLoader pluginLoader;

    public PluginManagement(PluginRepository pluginRepository, PluginContext pluginContext, PluginLoader pluginLoader) {
        this.pluginRepository = pluginRepository;
        this.pluginContext = pluginContext;
        this.pluginLoader = pluginLoader;
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
        plugin.execute(pluginContext);
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
}
