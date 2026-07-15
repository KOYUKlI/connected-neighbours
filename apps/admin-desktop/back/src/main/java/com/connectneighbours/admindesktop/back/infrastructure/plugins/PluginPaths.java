package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import java.io.File;

public final class PluginPaths {
    private PluginPaths() {
    }

    public static File pluginsDirectory() {
        return new File(System.getProperty("user.home"), ".connect-neighbours" + File.separator + "plugins");
    }
}
