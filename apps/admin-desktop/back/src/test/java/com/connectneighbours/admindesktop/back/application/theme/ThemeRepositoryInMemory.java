package com.connectneighbours.admindesktop.back.application.theme;

import com.connectneighbours.admindesktop.back.domain.theme.RGB;
import com.connectneighbours.admindesktop.back.domain.theme.Theme;
import com.connectneighbours.admindesktop.back.domain.theme.ThemeRepository;

import java.util.*;

public class ThemeRepositoryInMemory implements ThemeRepository {

    private final Map<UUID, Theme> storage = new HashMap<>();

    @Override
    public Optional<Theme> findById(UUID uuid) {
        return Optional.ofNullable(storage.get(uuid));
    }

    @Override
    public List<Theme> findAll() {
        return new ArrayList<>(storage.values());
    }

    @Override
    public List<Theme> findByName(String name) {
        return storage.values().stream()
                .filter(t -> t.getName().equals(name))
                .toList();
    }

    @Override
    public List<Theme> findByRGB(RGB rgb) {
        return storage.values().stream()
                .filter(t -> t.getRgb().equals(rgb))
                .toList();
    }

    @Override
    public Theme save(Theme theme) {
        // Simule le comportement JPA : si pas d’ID → on en génère un
        if (theme.getThemeId() == null) {
            try {
                var field = Theme.class.getDeclaredField("themeId");
                field.setAccessible(true);
                field.set(theme, UUID.randomUUID());
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        storage.put(theme.getThemeId(), theme);
        return theme;
    }

    @Override
    public void delete(Theme theme) {
        storage.remove(theme.getThemeId());
    }
}

