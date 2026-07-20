package com.connectneighbours.admindesktop.back.domain.reporter;

import jakarta.persistence.*;
import javafx.scene.image.Image;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity(name = "reporter")
public class Reporter {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID idReporter;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime dateUpdate;

    @Column(nullable = false, length = 50)
    private String firstname;

    @Column(nullable = false, length = 50)
    private String lastname;

    @Column(length = 255)
    private String avatarPath;

    @Column(length = 255, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @ColumnDefault("'RESIDENT'")
    private ReporterRole role;


    public Reporter() {
    }

    public Reporter(LocalDateTime dateCreation, LocalDateTime dateUpdate, String firstname, String lastname) {
        this.dateCreation = dateCreation;
        this.dateUpdate = dateUpdate;
        this.firstname = firstname;
        this.lastname = lastname;
        this.role = ReporterRole.RESIDENT;
    }

    public Reporter(String firstname, String lastname, String avatarPath) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.avatarPath = avatarPath;
        this.role = ReporterRole.RESIDENT;
    }

    public Reporter(String firstname, String lastname) {
        this.idReporter = UUID.randomUUID();
        this.dateCreation = LocalDateTime.now();
        this.dateUpdate = LocalDateTime.now();
        this.firstname = firstname;
        this.lastname = lastname;
        this.avatarPath = "/assets/default_avatar.png";
        this.role = ReporterRole.RESIDENT;
    }

    public Reporter(String firstname, String lastname, String email, ReporterRole role) {
        this.idReporter = UUID.randomUUID();
        this.dateCreation = LocalDateTime.now();
        this.dateUpdate = LocalDateTime.now();
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.avatarPath = "/assets/default_avatar.png";
        this.role = role;
    }

    public UUID getIdReporter() {
        return idReporter;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public LocalDateTime getDateUpdate() {
        return dateUpdate;
    }

    public String getFirstname() {
        return firstname;
    }

    public String getLastname() {
        return lastname;
    }

    public String getAvatarPath() {
        return avatarPath;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public ReporterRole getRole() {
        return role;
    }

    public void setRole(ReporterRole role) {
        this.role = role;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public void setDateUpdate(LocalDateTime dateUpdate) {
        this.dateUpdate = dateUpdate;
    }
}

