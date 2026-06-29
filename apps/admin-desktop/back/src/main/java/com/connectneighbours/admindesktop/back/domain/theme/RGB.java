package com.connectneighbours.admindesktop.back.domain.theme;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;

@Embeddable
public record RGB(@NotNull @Max(255) Long red, @NotNull @Max(255) Long green, @NotNull @Max(255) Long blue) {
}
