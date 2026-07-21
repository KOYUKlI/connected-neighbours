package com.connectneighbours.admindesktop.back.application.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReporterMapperTest {

    @Test
    void toDTO_shouldMapAllFields() {
        var reporter = new Reporter("John", "Doe", "/assets/avatar.png");

        var dto = ReporterMapper.toDTO(reporter);

        assertEquals(reporter.getIdReporter(), dto.idReporter());
        assertEquals("John", dto.firstname());
        assertEquals("Doe", dto.lastname());
        assertEquals("/assets/avatar.png", dto.avatarPath());
    }
}
