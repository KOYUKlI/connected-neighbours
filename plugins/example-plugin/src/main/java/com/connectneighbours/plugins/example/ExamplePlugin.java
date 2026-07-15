package com.connectneighbours.plugins.example;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.Plugin;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.PluginContext;

public class ExamplePlugin implements Plugin {

    @Override
    public void execute(PluginContext context) {
        context.log("Plugin \"Example Plugin\" exécuté");
        context.log("Incidents connus : " + context.getIncidentDTOList().size());
        context.log("Alertes connues : " + context.getAlertDTOList().size());
        context.log("Opération terminée.");
    }

    @Override
    public void export(PluginContext context) {
        context.log("Export non implémenté pour Example Plugin");
    }

    @Override
    public String getName() {
        return "Example Plugin";
    }

    @Override
    public String getVersion() {
        return "1.0";
    }

    @Override
    public String getAuthor() {
        return "Connect Neighbours";
    }

    @Override
    public String getDescription() {
        return "Plugin d'exemple qui journalise le nombre d'incidents et d'alertes connus.";
    }
}
