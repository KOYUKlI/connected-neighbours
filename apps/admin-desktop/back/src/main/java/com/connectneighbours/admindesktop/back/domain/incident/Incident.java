package com.connectneighbours.admindesktop.back.domain.incident;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Entity(name = "incident")
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID incidentId;

    @Column(nullable = false, unique = true)
    private String displayId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "reporter_id")
    private Reporter reporter;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private IncidentSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private List<Alert> alerts = new ArrayList<>();

    @Column
    private Instant updatedAt;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime resolvedAt;

    @Transient
    private static AtomicLong counter = new AtomicLong(1);

    public Incident() {
    }

    public Incident(Reporter reporter, String title, String description, IncidentType type,IncidentSeverity severity) {
        this.reporter = reporter;
        this.title = title;
        this.description = description;
        this.type = type;
        this.status = IncidentStatus.CREATED;
        this.severity = severity;
        this.displayId = generateDisplayId();
    }

    public Incident(Reporter reporter,
                    String title,
                    String description,
                    IncidentType type,
                    IncidentSeverity severity,
                    LocalDateTime createdAt) {

        this.reporter = reporter;
        this.title = title;
        this.description = description;
        this.type = type;
        this.severity = severity;
        this.status = IncidentStatus.CREATED;
        this.displayId = generateDisplayId();
        this.createdAt = createdAt;
    }


    public Incident(Reporter reporter, String title, String description, IncidentType type, Clock clock) {
        this.incidentId = UUID.randomUUID();
        this.reporter = reporter;
        this.title = title;
        this.description = description;
        this.type = type;
        this.status = IncidentStatus.CREATED;
        this.createdAt = LocalDateTime.now(clock);

    }

    public UUID getIncidentId() {
        return incidentId;
    }

    public String getDisplayId() {
        return displayId;
    }

    public Reporter getReporter() {
        return reporter;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public IncidentType getType() {
        return type;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public List<Alert> getAlerts() {
        return alerts;
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

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setType(IncidentType type) {
        this.type = type;
    }

    public void resolve() {
        this.status = IncidentStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
    }

    public void open() {
        this.status = IncidentStatus.OPEN;
    }

    public void close() {
        this.status = IncidentStatus.CLOSED;
        this.resolvedAt = LocalDateTime.now();
    }

    public void inProgress() {
        this.status = IncidentStatus.IN_PROGRESS;
    }

    public boolean hasCriticalOpenAlerts() {
        return alerts.stream().anyMatch(a -> a.getSeverity().equals(AlertSeverity.CRITICAL) && !a.isResolved() && a.getStatus().equals(AlertStatus.OPEN) || a.getStatus().equals(AlertStatus.IN_PROGRESS));
    }

    public boolean isResolved() {
        return status.equals(IncidentStatus.RESOLVED);
    }

    public boolean isOpen() {
        return status.equals(IncidentStatus.OPEN);
    }

    public boolean isInProgress() {
        return status.equals(IncidentStatus.IN_PROGRESS);
    }

    public boolean isClosed() {return status.equals(IncidentStatus.CLOSED);}

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Incident incident = (Incident) o;
        return Objects.equals(incidentId, incident.incidentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(incidentId);
    }

    private String generateDisplayId() {
        long number = System.currentTimeMillis() % 100000;
        long inc = counter.getAndIncrement();
        return "INC-" + String.format("%05d", number) + "-" + String.format("%04d",inc);
    }


}
