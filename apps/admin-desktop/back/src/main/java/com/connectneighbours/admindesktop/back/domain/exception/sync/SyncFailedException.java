package com.connectneighbours.admindesktop.back.domain.exception.sync;

public class SyncFailedException extends RuntimeException {
    public SyncFailedException(String message) {
        super(message);
    }
}
