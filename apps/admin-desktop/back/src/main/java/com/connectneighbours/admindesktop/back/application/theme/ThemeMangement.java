package com.connectneighbours.admindesktop.back.application.theme;

import com.connectneighbours.admindesktop.back.domain.exception.theme.ThemeNotFoundException;
import com.connectneighbours.admindesktop.back.domain.theme.RGB;
import com.connectneighbours.admindesktop.back.domain.theme.Theme;
import com.connectneighbours.admindesktop.back.domain.theme.ThemeRepository;

import java.util.List;
import java.util.UUID;

public class ThemeMangement {
    private final ThemeRepository themeRepository;

    public ThemeMangement(ThemeRepository themeRepository) {
        this.themeRepository = themeRepository;
    }

    public ThemeDTO createTheme(CreationThemeDTO dto){
        validateCreate(dto);
        var theme = new Theme(dto.name(),dto.rgb());

        var themeSaved = themeRepository.save(theme);

        return new ThemeDTO(themeSaved.getThemeId(),themeSaved.getName(),themeSaved.getRgb());
    }

    public ThemeDTO updateTheme(UUID uuid,UpdateThemeDTO dto) {
        validateUpdate(dto);
        var theme = loadTheme(uuid);
        theme.update(dto.name(),dto.rgb());

        var themeSaved = themeRepository.save(theme);

        return new ThemeDTO(theme.getThemeId(),themeSaved.getName(),themeSaved.getRgb());
    }

    public List<ThemeDTO> listThemes() {
        return themeRepository.findAll().stream()
                .map(t -> new ThemeDTO(t.getThemeId(),t.getName(),t.getRgb()))
                .toList();
    }

    public List<ThemeDTO> listByName(String name) {
        return themeRepository.findByName(name).stream()
                .map(t -> new ThemeDTO(t.getThemeId(),t.getName(),t.getRgb()))
                .toList();
    }

    public List<ThemeDTO> listByRgb(RGB rgb) {
        return themeRepository.findByRGB(rgb).stream()
                .map(t -> new ThemeDTO(t.getThemeId(),t.getName(),t.getRgb()))
                .toList();
    }


    public void deleteTheme(UUID uuid) {
        var theme = loadTheme(uuid);
        themeRepository.delete(theme);
    }

    private Theme loadTheme(UUID uuid) {
        return themeRepository.findById(uuid).orElseThrow(() -> new ThemeNotFoundException("Theme not found with id : " +uuid));
    }

    private void validateCreate(CreationThemeDTO dto) {
        if (dto.name() == null || dto.name().isBlank()) {
            throw new IllegalArgumentException("Theme name cannot be null or empty");
        }
        if (dto.rgb() == null) {
            throw new IllegalArgumentException("RGB cannot be null");
        }
    }

    private void validateUpdate(UpdateThemeDTO dto) {
        if (dto.name() == null || dto.name().isBlank()) {
            throw new IllegalArgumentException("Theme name cannot be null or empty");
        }
        if (dto.rgb() == null) {
            throw new IllegalArgumentException("RGB cannot be null");
        }
    }

}
