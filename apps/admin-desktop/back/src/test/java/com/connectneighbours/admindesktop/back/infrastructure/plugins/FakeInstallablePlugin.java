package com.connectneighbours.admindesktop.back.infrastructure.plugins;

public class FakeInstallablePlugin implements Plugin {

    @Override
    public void execute(PluginContext context) {
    }

    @Override
    public void export(PluginContext context) {
    }

    @Override
    public String getName() {
        return "Fake Installable Plugin";
    }

    @Override
    public String getVersion() {
        return "1.0";
    }

    @Override
    public String getAuthor() {
        return "Test";
    }

    @Override
    public String getDescription() {
        return "Used to test PluginLoader's real jar-scanning and classloading logic";
    }
}
