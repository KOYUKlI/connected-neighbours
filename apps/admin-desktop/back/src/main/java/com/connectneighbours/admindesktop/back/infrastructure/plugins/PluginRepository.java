package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PluginRepository {
    PluginDTO save(PluginDTO pluginDTO);
    Optional<PluginDTO> findById(UUID uuid);
    List<PluginDTO> findAll();
    List<PluginDTO> findByName(String name);
    List<PluginDTO> findByAuthor(String author);
    List<PluginDTO> findByStatePlugin(StatePlugin statePlugin);
    void delete(UUID uuid);
}
