package com.connectneighbours.admindesktop.back.application.reporter;

import jakarta.validation.constraints.NotBlank;

public record UpdateReporterDTO(@NotBlank String firstname, @NotBlank String lastname) {
}
