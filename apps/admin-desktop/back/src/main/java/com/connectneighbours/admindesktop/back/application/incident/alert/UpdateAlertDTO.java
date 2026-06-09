package com.connectneighbours.admindesktop.back.application.incident.alert;

import com.connectneighbours.admindesktop.back.domain.alert.Severity;

public record UpdateAlertDTO(
        String message,
        Severity severity
) {}

