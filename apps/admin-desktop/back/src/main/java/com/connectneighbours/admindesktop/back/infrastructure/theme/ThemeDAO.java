package com.connectneighbours.admindesktop.back.infrastructure.theme;

import com.connectneighbours.admindesktop.back.domain.theme.RGB;
import com.connectneighbours.admindesktop.back.domain.theme.Theme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ThemeDAO extends JpaRepository<Theme, UUID> {
    List<Theme> findByName(String name);

    List<Theme> findByRgb(RGB rgb);
}
