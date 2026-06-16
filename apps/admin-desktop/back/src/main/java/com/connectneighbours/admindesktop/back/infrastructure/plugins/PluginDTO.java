package com.connectneighbours.admindesktop.back.infrastructure.plugins;

public record PluginDTO(String name, String version, String author, String description, String path, String mainClass, StatePlugin statePlugin) {
}
