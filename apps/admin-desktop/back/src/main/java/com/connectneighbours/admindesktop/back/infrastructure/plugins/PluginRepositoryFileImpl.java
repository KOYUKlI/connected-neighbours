package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.File;
import java.io.IOException;
import java.util.*;


public class PluginRepositoryFileImpl implements PluginRepository {
    private static final File REGISTRY_FILE = new File(PluginPaths.pluginsDirectory(), "registry.json");

    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private final Map<UUID, PluginDTO> data = new HashMap<>();

    public PluginRepositoryFileImpl() {
        load();
    }

    @Override
    public PluginDTO save(PluginDTO pluginDTO) {
        data.put(pluginDTO.uuid(), pluginDTO);
        persist();
        return pluginDTO;
    }

    @Override
    public Optional<PluginDTO> findById(UUID uuid) {
        return Optional.ofNullable(data.get(uuid));
    }

    @Override
    public void delete(UUID uuid) {
        data.remove(uuid);
        persist();
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

    @Override
    public List<PluginDTO> findAll() {
        return data.values().stream().toList();
    }

    private void load() {
        if (!REGISTRY_FILE.exists()) return;

        try {
            List<PluginDTO> stored = mapper.readValue(
                    REGISTRY_FILE,
                    mapper.getTypeFactory().constructCollectionType(List.class, PluginDTO.class)
            );
            for (PluginDTO dto : stored) {
                data.put(dto.uuid(), dto);
            }
        } catch (IOException e) {
            throw new RuntimeException("Impossible de lire le registre des plugins : " + REGISTRY_FILE, e);
        }
    }

    private void persist() {
        try {
            var dir = REGISTRY_FILE.getParentFile();
            if (!dir.exists()) dir.mkdirs();
            mapper.writeValue(REGISTRY_FILE, new ArrayList<>(data.values()));
        } catch (IOException e) {
            throw new RuntimeException("Impossible d'écrire le registre des plugins : " + REGISTRY_FILE, e);
        }
    }
}
