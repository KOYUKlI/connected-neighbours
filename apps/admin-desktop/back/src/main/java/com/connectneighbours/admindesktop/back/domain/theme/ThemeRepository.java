package com.connectneighbours.admindesktop.back.domain.theme;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ThemeRepository {
    Optional<Theme> findById(UUID uuid);

    List<Theme> findAll();

    List<Theme> findByName(String name);

    List<Theme> findByRGB(RGB rgb);

    Theme save(Theme theme);

    void delete(Theme theme);
}
