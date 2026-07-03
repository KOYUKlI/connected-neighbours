package com.connectneighbours.admindesktop.back.domain.alert;

import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Entity(name = "alert")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID alertId;

    @Column(nullable = false, unique = true)
    private String displayId;

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
    private AlertSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status;

    @Column
    private Instant updatedAt;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime resolvedAt;

    @Transient
    private static AtomicLong counter = new AtomicLong(1);

    public Alert() {
    }

    public Alert(Incident incident,
                 Reporter reporter,
                 String title,
                 String details,
                 AlertSeverity severity) {
        this.incident = incident;
        this.reporter = reporter;
        this.title = title;
        this.details = details;
        this.severity = severity;
        this.status = AlertStatus.CREATED;
        this.displayId = generateDisplayId();
    }


    public Alert(Incident incident, String message, AlertSeverity severity) {
        this.alertId = UUID.randomUUID();
        this.incident = incident;
        this.details = message;
        this.severity = severity;
        this.status = AlertStatus.CREATED;

    }

    public UUID getAlertId() {
        return alertId;
    }

    public String getDisplayId() {
        return displayId;
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

    public AlertSeverity getSeverity() {
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public void setSeverity(AlertSeverity severity) {
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
        return severity.equals(AlertSeverity.CRITICAL);
    }

    public boolean isOpen() {
        return status.equals(AlertStatus.OPEN);
    }

    public boolean isInProgress() { return  status.equals(AlertStatus.IN_PROGRESS);}

    private String generateDisplayId() {
        long number = System.currentTimeMillis() % 100000;
        long inc = counter.getAndIncrement();
        return "ALT-" + String.format("%05d", number) + "-" + String.format("%04d",inc);
    }
}

