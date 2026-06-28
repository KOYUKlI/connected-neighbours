package com.connectneighbours.admindesktop.back.domain.alert;

import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertAlreadyOpenException;
import com.connectneighbours.admindesktop.back.domain.exception.alert.AlertAlreadyResolvedException;
import org.springframework.stereotype.Service;

@Service
public class AlertService {

    public void open(Alert alert) {
        if (alert.isOpen()) throw new AlertAlreadyOpenException("Alert already open");
        alert.open();
    }

    public void resolve(Alert alert) {
        if (alert.isResolved()) throw new AlertAlreadyResolvedException("Alert already resolved");

        alert.resolve();
    }

    public boolean canBeResolved(Alert alert) {
        return !alert.isResolved();
    }
}
