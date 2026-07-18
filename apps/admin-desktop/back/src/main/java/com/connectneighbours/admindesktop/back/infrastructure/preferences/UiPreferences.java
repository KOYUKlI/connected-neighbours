package com.connectneighbours.admindesktop.back.infrastructure.preferences;

public class UiPreferences {
    private String incidentType = "Tous";
    private String incidentStatus = "Tous";
    private String incidentGravity = "Toutes";

    private String alertGravity = "Toutes";
    private String alertStatus = "Tous";
    private String alertDate = "Toutes";

    private int incidentPerDayYAxisUpperBound = 5;

    private int averageSolutionTimeYAxisUpperBound = 200;
    private String averageSolutionTimeUnit = "HOURS";

    public String getIncidentType() {
        return incidentType;
    }

    public void setIncidentType(String incidentType) {
        this.incidentType = incidentType;
    }

    public String getIncidentStatus() {
        return incidentStatus;
    }

    public void setIncidentStatus(String incidentStatus) {
        this.incidentStatus = incidentStatus;
    }

    public String getIncidentGravity() {
        return incidentGravity;
    }

    public void setIncidentGravity(String incidentGravity) {
        this.incidentGravity = incidentGravity;
    }

    public String getAlertGravity() {
        return alertGravity;
    }

    public void setAlertGravity(String alertGravity) {
        this.alertGravity = alertGravity;
    }

    public String getAlertStatus() {
        return alertStatus;
    }

    public void setAlertStatus(String alertStatus) {
        this.alertStatus = alertStatus;
    }

    public String getAlertDate() {
        return alertDate;
    }

    public void setAlertDate(String alertDate) {
        this.alertDate = alertDate;
    }

    public int getIncidentPerDayYAxisUpperBound() {
        return incidentPerDayYAxisUpperBound;
    }

    public void setIncidentPerDayYAxisUpperBound(int incidentPerDayYAxisUpperBound) {
        this.incidentPerDayYAxisUpperBound = incidentPerDayYAxisUpperBound;
    }

    public int getAverageSolutionTimeYAxisUpperBound() {
        return averageSolutionTimeYAxisUpperBound;
    }

    public void setAverageSolutionTimeYAxisUpperBound(int averageSolutionTimeYAxisUpperBound) {
        this.averageSolutionTimeYAxisUpperBound = averageSolutionTimeYAxisUpperBound;
    }

    public String getAverageSolutionTimeUnit() {
        return averageSolutionTimeUnit;
    }

    public void setAverageSolutionTimeUnit(String averageSolutionTimeUnit) {
        this.averageSolutionTimeUnit = averageSolutionTimeUnit;
    }
}
