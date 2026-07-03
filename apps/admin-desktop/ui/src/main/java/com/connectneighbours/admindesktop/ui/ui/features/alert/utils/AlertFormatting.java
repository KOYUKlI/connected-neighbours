package com.connectneighbours.admindesktop.ui.ui.features.alert.utils;

public class AlertFormatting {
    public static String formatAlertStatus(String s) {
        if (s == null) return "";

        return switch (s) {
            case "RESOLVED" -> "Résolue";
            case "IN_PROGRESS" -> "En cours";
            case "CLOSED" -> "Fermée";
            case "CREATED" -> "Créée";
            case "OPEN" -> "Ouverte";
            case "LOW" -> "Faible";
            case "MEDIUM" -> "Moyenne";
            case "HIGH" -> "Élevée";
            case "CRITICAL" -> "Critique";
            default -> "";
        };
    }
}
