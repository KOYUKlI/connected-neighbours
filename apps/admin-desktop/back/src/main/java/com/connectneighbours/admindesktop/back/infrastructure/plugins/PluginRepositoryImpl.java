package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import java.util.*;

public class PluginRepositoryImpl implements PluginRepository{
    private final Map<UUID,PluginDTO> data = new HashMap<>();

    @Override
    public PluginDTO save(PluginDTO pluginDTO) {
        data.put(pluginDTO.uuid(),pluginDTO);
        return pluginDTO;
    }

    @Override
    public Optional<PluginDTO> findById(UUID uuid) {
        return Optional.ofNullable(data.get(uuid));
    }

    @Override
    public void delete(UUID uuid) {
        data.remove(uuid);
    }

    @Override
    public List<PluginDTO> findByName(String name) {
        return data.values().stream()
                .filter(p -> p.name().equals(name))
                .toList();
    }

    @Override
    public List<PluginDTO> findByAuthor(String author) {
        return data.values().stream()
                .filter(p -> p.author().equals(author))
                .toList();
    }

    @Override
    public List<PluginDTO> findByStatePlugin(StatePlugin statePlugin) {
        return data.values().stream()
                .filter(p -> p.statePlugin().equals(statePlugin))
                .toList();
    }
}
