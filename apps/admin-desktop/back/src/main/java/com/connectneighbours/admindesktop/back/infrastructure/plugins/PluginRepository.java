package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import java.util.UUID;

public interface PluginRepository {
    PluginDTO save();
    PluginDTO findById(UUID uuid);
    void delete(UUID uuid);
}
