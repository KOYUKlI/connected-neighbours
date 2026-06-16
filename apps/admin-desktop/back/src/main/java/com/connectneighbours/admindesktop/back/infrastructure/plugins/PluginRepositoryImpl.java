package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class PluginRepositoryImpl implements PluginRepository{
    private Map<UUID,PluginDTO> data = new HashMap<>();

    @Override
    public PluginDTO save() {
        return null;
    }

    @Override
    public PluginDTO findById(UUID uuid) {
        return null;
    }

    @Override
    public void delete(UUID uuid) {

    }
}
