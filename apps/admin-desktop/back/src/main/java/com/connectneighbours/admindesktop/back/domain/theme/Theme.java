package com.connectneighbours.admindesktop.back.domain.theme;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class Theme {
    @Id
    @Column(updatable = false,nullable = false,unique = true)
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID themeId;

    @Column(nullable = false, length = 255)
    private String name;

    @Embedded
    @Column(nullable = false)
    private RGB rgb;

    @CreationTimestamp
    @Column(nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Theme() {
    }

    public Theme(String name, RGB rgb) {
        this.name = name;
        this.rgb = rgb;
    }

    public Theme update(String name, RGB rgb) {
        this.name = name;
        this.rgb = rgb;
        return this;
    }

    public UUID getThemeId() {
        return themeId;
    }

    public String getName() {
        return name;
    }

    public RGB getRgb() {
        return rgb;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
