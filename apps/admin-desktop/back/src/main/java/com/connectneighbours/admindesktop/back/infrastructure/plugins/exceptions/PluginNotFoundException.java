package com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions;

public class PluginNotFoundException extends RuntimeException {
    public PluginNotFoundException(String message) {
        super(message);
    }
}
