package com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions;

public class PluginAlreadyExistException extends RuntimeException {
    public PluginAlreadyExistException(String message) {
        super(message);
    }
}
