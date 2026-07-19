package com.connectneighbours.admindesktop.ui.ui.features.incident.utils;

import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;

public class IncidentFormatting {

    public static String format(String string) {
        if (string == null || string.isBlank()) return "";

        return switch (string) {
            case "CREATED" -> "Signalé";
            case "IN_PROGRESS" -> "En cours";
            case "RESOLVED" -> "Résolu";
            case "OPEN" -> "Ouvert";
            case "CLOSED" -> "Fermé";
            case "SECURITY" -> "Sécurité";
            case "MAINTENANCE" -> "Maintenance";
            case "NUISANCE" -> "Nuisances";
            case "CLEANLINESS" -> "Propreté";
            case "TRAFFIC" -> "Circulation";
            case  "OTHER" -> "Autres...";
            default -> string;
        };
    }

    public static String colorHex(IncidentType type) {
        return switch (type) {
            case SECURITY -> "#0098C8";
            case NUISANCE -> "#FA9D03";
            case CLEANLINESS -> "#30AB41";
            case MAINTENANCE -> "#EA5F3B";
            case TRAFFIC -> "#7831A7";
            case OTHER -> "#4357D1";
        };
    }
}

