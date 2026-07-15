package com.connectneighbours.admindesktop.back.application.theme;

import com.connectneighbours.admindesktop.back.domain.exception.theme.ThemeNotFoundException;
import com.connectneighbours.admindesktop.back.domain.theme.RGB;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ThemeManagementTest {

    private ThemeRepositoryInMemory repository;
    private ThemeManagement management;

    @BeforeEach
    void setup() {
        repository = new ThemeRepositoryInMemory();
        management = new ThemeManagement(repository);
    }

    @Test
    void createTheme_shouldCreateThemeCorrectly() {
        var dto = new CreationThemeDTO("Light", new RGB(255L, 255L, 255L));

        var result = management.createTheme(dto);

        assertEquals("Light", result.name());
        assertEquals(dto.rgb(), result.rgb());
        assertEquals(1, repository.findAll().size());
    }

    @Test
    void createTheme_shouldThrow_whenNameIsBlank() {
        var dto = new CreationThemeDTO("", new RGB(255L, 255L, 255L));

        assertThrows(IllegalArgumentException.class, () -> management.createTheme(dto));
    }


    @Test
    void updateTheme_shouldUpdateExistingTheme() {
        var created = management.createTheme(new CreationThemeDTO("Old", new RGB(0L, 0L, 0L)));
        var id = repository.findAll().get(0).getThemeId();

        var dto = new UpdateThemeDTO("New", new RGB(100L, 100L, 100L));
        var updated = management.updateTheme(id, dto);

        assertEquals("New", updated.name());
        assertEquals(dto.rgb(), updated.rgb());
    }

    @Test
    void createTheme_shouldThrow_whenNameIsNull() {
        var dto = new CreationThemeDTO(null, new RGB(255L, 255L, 255L));

        assertThrows(IllegalArgumentException.class, () -> management.createTheme(dto));
    }

    @Test
    void createTheme_shouldThrow_whenRgbIsNull() {
        var dto = new CreationThemeDTO("Light", null);

        assertThrows(IllegalArgumentException.class, () -> management.createTheme(dto));
    }



    @Test
    void updateTheme_shouldThrow_whenThemeNotFound() {
        var id = UUID.randomUUID();
        var dto = new UpdateThemeDTO("New", new RGB(100L, 100L, 100L));

        assertThrows(ThemeNotFoundException.class, () -> management.updateTheme(id, dto));
    }

    @Test
    void updateTheme_shouldThrow_whenNameIsNull() {
        var created = management.createTheme(new CreationThemeDTO("Old", new RGB(0L,0L,0L)));
        var id = repository.findAll().get(0).getThemeId();

        var dto = new UpdateThemeDTO(null, new RGB(100L,100L,100L));

        assertThrows(IllegalArgumentException.class, () -> management.updateTheme(id, dto));
    }

    @Test
    void updateTheme_shouldThrow_whenNameIsBlank() {
        var created = management.createTheme(new CreationThemeDTO("Old", new RGB(0L,0L,0L)));
        var id = repository.findAll().get(0).getThemeId();

        var dto = new UpdateThemeDTO("", new RGB(100L,100L,100L));

        assertThrows(IllegalArgumentException.class, () -> management.updateTheme(id, dto));
    }


    @Test
    void updateTheme_shouldThrow_whenRgbIsNull() {
        var created = management.createTheme(new CreationThemeDTO("Old", new RGB(0L,0L,0L)));
        var id = repository.findAll().get(0).getThemeId();

        var dto = new UpdateThemeDTO("New", null);

        assertThrows(IllegalArgumentException.class, () -> management.updateTheme(id, dto));
    }



    @Test
    void listThemes_shouldReturnAllThemes() {
        management.createTheme(new CreationThemeDTO("Light", new RGB(255L, 255L, 255L)));
        management.createTheme(new CreationThemeDTO("Dark", new RGB(0L, 0L, 0L)));

        var result = management.listThemes();

        assertEquals(2, result.size());
    }

    @Test
    void deleteTheme_shouldDeleteExistingTheme() {
        management.createTheme(new CreationThemeDTO("Light", new RGB(255L, 255L, 255L)));
        var id = repository.findAll().get(0).getThemeId();

        management.deleteTheme(id);

        assertTrue(repository.findAll().isEmpty());
    }
}
