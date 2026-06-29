package com.connectneighbours.admindesktop.back.application.theme;

import com.connectneighbours.admindesktop.back.domain.theme.RGB;

import java.util.UUID;

public record ThemeDTO(UUID uuid, String name, RGB rgb) {
}
