package com.connectneighbours.admindesktop.ui.ui.features.plugin.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.plugin.model.ReadOnlyPluginProperty;
import com.connectneighbours.admindesktop.ui.ui.features.plugin.model.SimplePluginProperty;

public class PluginViewModel {
    private final SimplePluginProperty plugin = new SimplePluginProperty();

    public ReadOnlyPluginProperty pluginProperty() {
        return plugin;
    }

    public void setPlugin(ReadOnlyPluginProperty source) {
        if (source == null) {
            plugin.uuidProperty().set(null);
            plugin.nameProperty().set("");
            plugin.versionProperty().set("");
            plugin.authorProperty().set("");
            plugin.descriptionProperty().set("");
            plugin.statePluginProperty().set(null);
            return;
        }

        plugin.uuidProperty().set(source.uuidProperty().get());
        plugin.nameProperty().set(source.nameProperty().get());
        plugin.versionProperty().set(source.versionProperty().get());
        plugin.authorProperty().set(source.authorProperty().get());
        plugin.descriptionProperty().set(source.descriptionProperty().get());
        plugin.statePluginProperty().set(source.statePluginProperty().get());
    }
}
