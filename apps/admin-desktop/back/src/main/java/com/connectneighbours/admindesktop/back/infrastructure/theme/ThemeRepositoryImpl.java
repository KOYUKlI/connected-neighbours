package com.connectneighbours.admindesktop.back.infrastructure.theme;

import com.connectneighbours.admindesktop.back.domain.theme.RGB;
import com.connectneighbours.admindesktop.back.domain.theme.Theme;
import com.connectneighbours.admindesktop.back.domain.theme.ThemeRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ThemeRepositoryImpl implements ThemeRepository {
    private final ThemeDAO themeDAO;

    public ThemeRepositoryImpl(ThemeDAO themeDAO) {
        this.themeDAO = themeDAO;
    }

    @Override
    public Optional<Theme> findById(UUID uuid) {
        return themeDAO.findById(uuid);
    }

    @Override
    public List<Theme> findAll() {
        return themeDAO.findAll();
    }

    @Override
    public List<Theme> findByName(String name) {
        return themeDAO.findByName(name);
    }

    @Override
    public List<Theme> findByRGB(RGB rgb) {
        return themeDAO.findByRgb(rgb);
    }

    @Override
    public Theme save(Theme theme) {
        return themeDAO.save(theme);
    }

    @Override
    public void delete(Theme theme) {
        themeDAO.delete(theme);
    }
}
