package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;

import java.io.File;
import java.util.Arrays;

public class PluginLoader {
    private File file;

    public PluginLoader(File file) {
        this.file = file;
    }

    public File load(String name) {
        return Arrays.stream(inspected()).filter(f -> f.getName().equals(name)).findFirst().orElseThrow(() -> new PluginNotFoundException("Plugin not found with name : "+name));
    }

    public File scan() {
        return new File("");
    }

    private File[] inspected() {
        var file = new File("/plugins");
        return file.listFiles();
    }


}
