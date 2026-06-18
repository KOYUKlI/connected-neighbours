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

    @Column(length = 1000)
    private String message;

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

    public Alert(Incident incident, String message, Severity severity) {
        this.alertId = UUID.randomUUID();
        this.incident = incident;
        this.message = message;
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

    public String getMessage() {
        return message;
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

    public void setMessage(String message) {
        this.message = message;
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

    public boolean isResolved() {
        return status.equals(AlertStatus.RESOLVED);
    }

    public boolean isCritical() {
        return severity.equals(Severity.CRITICAL);
    }

    public boolean isOpen() {
        return status.equals(AlertStatus.OPEN);
    }


}

