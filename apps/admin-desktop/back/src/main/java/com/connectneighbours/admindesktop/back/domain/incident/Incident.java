package com.connectneighbours.admindesktop.back.domain.incident;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity(name = "incident")
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID incidentId;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL)
    private List<Alert> alerts = new ArrayList<>();

    @Column(nullable = false,updatable = false)
    @CreationTimestamp
    private LocalDateTime  createdAt;

    @Column
    private LocalDateTime resolvedAt;

    public Incident() {
    }

    public Incident(String title, String description, IncidentType type) {
        this.incidentId = UUID.randomUUID();
        this.title = title;
        this.description = description;
        this.type = type;
        this.status = IncidentStatus.CREATED;

    }

    public UUID getIncidentId() {
        return incidentId;
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

    public void close(){
        this.status = IncidentStatus.CLOSED;
        this.resolvedAt = LocalDateTime.now();
    }

    public void inProgress(){
        this.status = IncidentStatus.IN_PROGRESS;
    }

    public boolean hasCriticalOpenAlerts(){
        return alerts.stream().anyMatch(a -> a.getSeverity().equals(Severity.CRITICAL) && !a.isResolved() && a.getStatus().equals(AlertStatus.OPEN));
    }

    public boolean isResolved() {
        return status.equals(IncidentStatus.RESOLVED);
    }

    public boolean isOpen(){
        return status.equals(IncidentStatus.OPEN);
    }

    public boolean isInProgress(){
        return status.equals(IncidentStatus.IN_PROGRESS);
    }
}
