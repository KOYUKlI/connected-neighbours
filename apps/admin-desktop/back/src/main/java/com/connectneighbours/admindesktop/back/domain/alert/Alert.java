package com.connectneighbours.admindesktop.back.domain.alert;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity(name = "alert")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID alertId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "incident_id")
    private Incident incident;

    @ManyToOne(optional = false)
    @JoinColumn(name = "reporter_id")
    private Reporter reporter;

    @Column(length = 50)
    private String title;

    @Column(length = 1000)
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    public Alert() {
    }

    public Alert(Incident incident,
                 Reporter reporter,
                 String title,
                 String details,
                 Severity severity) {
        this.incident = incident;
        this.reporter = reporter;
        this.title = title;
        this.details = details;
        this.severity = severity;
        this.status = AlertStatus.CREATED;
    }


    public Alert(Incident incident, String message, Severity severity) {
        this.alertId = UUID.randomUUID();
        this.incident = incident;
        this.details = message;
        this.severity = severity;
        this.status = AlertStatus.CREATED;

    }

    public UUID getAlertId() {
        return alertId;
    }

    public Reporter getReporter() {
        return reporter;
    }

    public Incident getIncident() {
        return incident;
    }

    public String getDetails() {
        return details;
    }

    public String getTitle() {
        return title;
    }

    public Severity getSeverity() {
        return severity;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }

    public void setReporter(Reporter reporter) {
        this.reporter = reporter;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public void resolve() {
        this.status = AlertStatus.RESOLVED;
    }

    public void open() {
        this.status = AlertStatus.OPEN;
    }

    public void inProgress() { this.status = AlertStatus.IN_PROGRESS; }

    public boolean isResolved() {
        return status.equals(AlertStatus.RESOLVED);
    }

    public boolean isCritical() {
        return severity.equals(Severity.CRITICAL);
    }

    public boolean isOpen() {
        return status.equals(AlertStatus.OPEN);
    }

    public boolean isInProgress() { return  status.equals(AlertStatus.IN_PROGRESS);}
}

