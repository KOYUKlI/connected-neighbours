package com.connectneighbours.admindesktop.ui.ui.features.theme.viewmodel;

import com.connectneighbours.admindesktop.ui.ui.features.theme.model.ReadOnlyThemeProperty;
import com.connectneighbours.admindesktop.ui.ui.features.theme.model.SimpleThemeProperty;

public class ThemeViewModel {
    private final SimpleThemeProperty theme = new SimpleThemeProperty();

    public ReadOnlyThemeProperty themeProperty() {
        return theme;
    }

    public void setTheme(ReadOnlyThemeProperty source) {
        if (source == null) {
            theme.uuidProperty().set(null);
            theme.nameProperty().set("");
            theme.redProperty().set(0);
            theme.greenProperty().set(0);
            theme.blueProperty().set(0);
            return;
        }

        theme.uuidProperty().set(source.uuidProperty().get());
        theme.nameProperty().set(source.nameProperty().get());
        theme.redProperty().set(source.redProperty().get());
        theme.greenProperty().set(source.greenProperty().get());
        theme.blueProperty().set(source.blueProperty().get());
    }
}
