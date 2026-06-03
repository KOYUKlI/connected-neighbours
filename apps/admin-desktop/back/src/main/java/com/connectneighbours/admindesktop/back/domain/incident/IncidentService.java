package com.connectneighbours.admindesktop.back.domain.incident;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.exception.*;

public class IncidentService {
    public void open(Incident incident){
        if(incident.isOpen()) throw new IncidentAlreadyOpenException("Incident already open");

        if(incident.isResolved()) throw new IncidentAlreadyResolvedException("Incident already resolved");

        incident.open();
    }

    public void resolve(Incident incident){
        if(incident.isResolved()) throw new IncidentAlreadyResolvedException("Incident already resolved");

        if (incident.hasCriticalOpenAlerts()) throw new IncidentHasCriticalAlertsException("Cannot resolve incident with critical alerts");

        incident.resolve();
    }

    public void startProgress(Incident incident){
        if(incident.isInProgress()) throw new IncidentAlreadyInProgressException("Incident already in progress");

        incident.inProgress();
    }

    public void attachAlert(Incident incident, Alert alert){
        if(incident.isResolved()) throw new IncidentAlreadyResolvedException("Incident Already resolved");

        if(alert.isResolved()) throw new AlertAlreadyResolvedException("Alert already resolved");

        incident.getAlerts().add(alert);
    }

    public void detachAlert(Incident incident, Alert alert){
        if(!alert.isResolved()) throw new AlertNotResolvedException("Alert not resolved");

        incident.getAlerts().remove(alert);
    }

    public boolean canBeResolved(Incident incident) {
        if (incident.isResolved()) return false;

        return !incident.hasCriticalOpenAlerts();
    }

    public void ensureCanBeDeleted(Incident incident) {
        if (!(incident.getStatus() == IncidentStatus.RESOLVED ||
                incident.getStatus() == IncidentStatus.CLOSED)) {
            throw new IncidentDeletionNotAllowedException(
                    "Incident must be resolved or closed before deletion"
            );
        }
    }

}
