package com.connectneighbours.plugins.exportcsv;

import com.connectneighbours.admindesktop.back.application.incident.IncidentDTO;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.Plugin;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.PluginContext;

import java.nio.charset.StandardCharsets;
import java.util.List;

public class ExportCsvPlugin implements Plugin {

    private static final String[] HEADERS = {
            "id", "titre", "description", "type", "statut", "gravite",
            "reporter", "cree_le", "resolu_le"
    };

    @Override
    public void execute(PluginContext context) {
        context.log("Plugin \"Export CSV\" exécuté");
        context.log("Exportation des incidents...");

        List<IncidentDTO> incidents = context.getIncidentDTOList();
        String csv = toCsv(incidents);

        context.saveFile("incidents.csv", csv.getBytes(StandardCharsets.UTF_8));

        context.log("Incidents exportés avec succès : incidents.csv créé (" + incidents.size() + " ligne(s))");
        context.log("Opération terminée.");
    }

    @Override
    public void export(PluginContext context) {
        execute(context);
    }

    @Override
    public String getName() {
        return "Export CSV";
    }

    @Override
    public String getVersion() {
        return "1.0";
    }

    @Override
    public String getAuthor() {
        return "Plugin Solutions";
    }

    @Override
    public String getDescription() {
        return "Permet d'exporter les incidents au format CSV.";
    }

    private String toCsv(List<IncidentDTO> incidents) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(";", HEADERS)).append("\n");

        for (IncidentDTO incident : incidents) {
            sb.append(escape(incident.displayId())).append(";")
                    .append(escape(incident.title())).append(";")
                    .append(escape(incident.description())).append(";")
                    .append(escape(incident.type().toString())).append(";")
                    .append(escape(incident.status().toString())).append(";")
                    .append(escape(incident.severity().toString())).append(";")
                    .append(escape(incident.reporter().firstname() + " " + incident.reporter().lastname())).append(";")
                    .append(escape(String.valueOf(incident.createdAt()))).append(";")
                    .append(escape(incident.resolvedAt() == null ? "" : incident.resolvedAt().toString()))
                    .append("\n");
        }

        return sb.toString();
    }

    private String escape(String value) {
        if (value == null) return "";
        String cleaned = value.replace("\"", "\"\"");
        if (cleaned.contains(";") || cleaned.contains("\n") || cleaned.contains("\"")) {
            return "\"" + cleaned + "\"";
        }
        return cleaned;
    }
}
