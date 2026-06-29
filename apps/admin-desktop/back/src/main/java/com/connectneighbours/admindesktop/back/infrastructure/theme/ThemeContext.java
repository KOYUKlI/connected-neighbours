package com.connectneighbours.admindesktop.back.infrastructure.theme;

import com.connectneighbours.admindesktop.back.application.theme.ThemeDTO;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleObjectProperty;

public class ThemeContext {

    private final ObjectProperty<ThemeDTO> activeTheme = new SimpleObjectProperty<>();

    public ThemeDTO getActiveTheme() {
        return activeTheme.get();
    }

    public void setActiveTheme(ThemeDTO theme) {
        this.activeTheme.set(theme);
    }

    public ObjectProperty<ThemeDTO> activeThemeProperty() {
        return activeTheme;
    }
}

