package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class LoggerPlugin {
    private final List<String> logs = new ArrayList<>();

    public void info(String message) {
        logs.add("[" + LocalDateTime.now() +"] " + "[INFO] " + message);
    }

    public void error(String message) {
        logs.add("[" + LocalDateTime.now() +"] " + "[ERROR] " + message);
    }

    public void warn(String message) {
        logs.add("[" + LocalDateTime.now() +"] " + "[WARNING] " + message);
    }

    public List<String> getLogs() {
        return List.copyOf(logs);
    }
}
