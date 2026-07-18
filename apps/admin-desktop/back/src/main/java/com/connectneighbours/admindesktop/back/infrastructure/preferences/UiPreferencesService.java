package com.connectneighbours.admindesktop.back.infrastructure.preferences;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class UiPreferencesService {
    private static final File PREFERENCES_FILE = new File(
            System.getProperty("user.home"),
            ".connect-neighbours" + File.separator + "ui-preferences.json"
    );

    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private UiPreferences preferences;

    public UiPreferencesService() {
        preferences = load();
    }

    public UiPreferences get() {
        return preferences;
    }

    public void save(UiPreferences preferences) {
        this.preferences = preferences;
        persist();
    }

    private UiPreferences load() {
        if (!PREFERENCES_FILE.exists()) return new UiPreferences();

        try {
            return mapper.readValue(PREFERENCES_FILE, UiPreferences.class);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de lire les préférences UI : " + PREFERENCES_FILE, e);
        }
    }

    private void persist() {
        try {
            var dir = PREFERENCES_FILE.getParentFile();
            if (!dir.exists()) dir.mkdirs();
            mapper.writeValue(PREFERENCES_FILE, preferences);
        } catch (IOException e) {
            throw new RuntimeException("Impossible d'écrire les préférences UI : " + PREFERENCES_FILE, e);
        }
    }
}
