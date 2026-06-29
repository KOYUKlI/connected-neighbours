package com.connectneighbours.admindesktop.back.infrastructure.plugins;

public interface Plugin {
    void execute(PluginContext context);

    void export(PluginContext context);

    String getName();

    String getVersion();

    String getAuthor();

    String getDescription();
}
