package com.connectneighbours.admindesktop.back.infrastructure.plugins;

public interface Plugin {
    void execute(PluginContext context);
    String getName();
    String getVersion();
    String getDescription();
}
