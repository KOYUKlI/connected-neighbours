package com.connectneighbours.admindesktop.back.infrastructure.plugins.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.Plugin;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.PluginContext;

public class FakePlugin implements Plugin {
    public boolean executed = false;

    @Override
    public void execute(PluginContext context) {
        executed = true;
        context.log("test");
    }

    @Override
    public void export(PluginContext context) {

    }

    @Override
    public String getName() {
        return "";
    }

    @Override
    public String getVersion() {
        return "";
    }

    @Override
    public String getAuthor() {
        return "";
    }

    @Override
    public String getDescription() {
        return "";
    }
}

