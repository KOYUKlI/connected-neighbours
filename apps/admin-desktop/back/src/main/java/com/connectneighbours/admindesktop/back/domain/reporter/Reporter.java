package com.connectneighbours.admindesktop.back.domain.reporter;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity(name = "reporter")
public class Reporter {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private UUID idReporter;

    @Column(nullable = false,updatable = false)
    @CreationTimestamp
    private LocalDateTime dateCreation;

    @Column(nullable = false)
    private LocalDateTime dateUpdate;

    @Column(nullable = false, length = 50)
    private String firstname;

    @Column(nullable = false, length = 50)
    private String lastname;

    public Reporter() {
    }

    public Reporter(String firstname, String lastname) {
        this.idReporter = UUID.randomUUID();
        this.firstname = firstname;
        this.lastname = lastname;
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
}
