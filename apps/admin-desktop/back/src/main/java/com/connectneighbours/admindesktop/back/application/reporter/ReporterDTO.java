package com.connectneighbours.admindesktop.back.application.reporter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReporterDTO(
        @NotNull UUID idReporter,
        @NotBlank String firstname,
        @NotBlank String lastname
) {
}
