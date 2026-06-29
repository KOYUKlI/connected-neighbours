package com.connectneighbours.admindesktop.ui.ui.features.incident.utils;

public class IncidentFormatting {

    public static String format(String string) {
        if (string == null || string.isBlank()) return "";

        return switch (string) {
            case "IN_PROGRESS" -> "En cours";
            case "RESOLVED" -> "Résolu";
            case "OPEN" -> "Ouvert";
            case "SECURITY" -> "Sécurité";
            case "MAINTENANCE" -> "Maintenance";
            case "NUISANCE" -> "Nuisances";
            case "CLEANLINESS" -> "Propreté";
            case "TRAFFIC" -> "Circulation";
            case  "OTHER" -> "Autres...";
            default -> string;
        };
    }
}

