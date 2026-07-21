package com.connectneighbours.admindesktop.back.infrastructure.theme;

import com.connectneighbours.admindesktop.back.domain.theme.RGB;
import com.connectneighbours.admindesktop.back.domain.theme.Theme;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ThemeDAOTest {

    @Autowired
    private ThemeDAO themeDAO;

    @Test
    void findByName_shouldReturnMatchingThemes() {
        themeDAO.save(new Theme("Dark", new RGB(0L, 0L, 0L)));
        themeDAO.save(new Theme("Light", new RGB(255L, 255L, 255L)));

        var result = themeDAO.findByName("Dark");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRgb()).isEqualTo(new RGB(0L, 0L, 0L));
    }

    @Test
    void findByName_shouldReturnEmpty_whenUnknown() {
        assertThat(themeDAO.findByName("Unknown")).isEmpty();
    }

    @Test
    void findByRgb_shouldReturnMatchingThemes() {
        themeDAO.save(new Theme("Dark", new RGB(0L, 0L, 0L)));
        themeDAO.save(new Theme("AlsoBlack", new RGB(0L, 0L, 0L)));
        themeDAO.save(new Theme("Light", new RGB(255L, 255L, 255L)));

        var result = themeDAO.findByRgb(new RGB(0L, 0L, 0L));

        assertThat(result).hasSize(2);
    }

    @Test
    void save_shouldPersistThemeWithGeneratedId() {
        var saved = themeDAO.save(new Theme("Custom", new RGB(10L, 20L, 30L)));

        assertThat(saved.getThemeId()).isNotNull();

        var found = themeDAO.findById(saved.getThemeId());
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Custom");
    }
}
