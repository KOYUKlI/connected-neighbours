package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.plugins.FakePlugin;

import java.io.File;

public class FakePluginLoader extends PluginLoader {
    @Override
    public Plugin load(File file) {
        return new FakePlugin();
    }

    @Override
    public File installJar(File jar) {
        return jar;
    }

    @Override
    public PluginMetaData inspect(File jar) {
        return new PluginMetaData(
                "FakePlugin",
                "1.0",
                "Test",
                "desc",
                "FakePlugin"
        );
    }
}

