package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import java.util.UUID;

public record PluginDTO(UUID uuid,String name, String version, String author, String description, String path, String mainClass, StatePlugin statePlugin) {
}
