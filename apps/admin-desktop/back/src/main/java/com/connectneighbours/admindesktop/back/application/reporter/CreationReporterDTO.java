package com.connectneighbours.admindesktop.back.application.reporter;

import jakarta.validation.constraints.NotNull;

public record CreationReporterDTO(@NotNull String firstname, @NotNull String lastname) {
}
