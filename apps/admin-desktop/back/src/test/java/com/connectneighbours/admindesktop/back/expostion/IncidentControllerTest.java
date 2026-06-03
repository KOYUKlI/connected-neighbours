package com.connectneighbours.admindesktop.back.expostion;

import com.connectneighbours.admindesktop.back.application.incident.service.CreationIncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.IncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.service.UpdateIncidentDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.AlertDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.CreationAlertDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.UpdateAlertDTO;
import com.connectneighbours.admindesktop.back.domain.alert.AlertStatus;
import com.connectneighbours.admindesktop.back.domain.alert.Severity;
import com.connectneighbours.admindesktop.back.domain.exception.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentStatus;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.exception.IncidentConflictException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestConfig.class)
class IncidentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IncidentManagement management;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getIncident_shouldReturnIncidentResponse() throws Exception {
        UUID id = UUID.randomUUID();

        IncidentDTO dto = new IncidentDTO(
                id,
                "Fire",
                "Kitchen fire",
                IncidentType.MAINTENANCE,
                IncidentStatus.OPEN,
                List.of()
        );

        when(management.getIncident(id)).thenReturn(dto);

        mockMvc.perform(get("/incidents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.title").value("Fire"))
                .andExpect(jsonPath("$.description").value("Kitchen fire"))
                .andExpect(jsonPath("$.type").value("MAINTENANCE"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void getIncident_shouldReturn404_whenNotFound() throws Exception {
        UUID id = UUID.randomUUID();

        when(management.getIncident(id))
                .thenThrow(new IncidentNotFoundException(id.toString()));

        mockMvc.perform(get("/incidents/" + id))
                .andExpect(status().isNotFound());
    }


    @Test
    void listIncidents_shouldReturnPaginatedList() throws Exception {
        List<IncidentDTO> list = List.of(
                new IncidentDTO(UUID.randomUUID(), "i0", "desc", IncidentType.OTHER, IncidentStatus.OPEN, List.of()),
                new IncidentDTO(UUID.randomUUID(), "i1", "desc", IncidentType.OTHER, IncidentStatus.OPEN, List.of())
        );

        when(management.listIncidents(0, 10)).thenReturn(list);

        mockMvc.perform(get("/incidents?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("i0"))
                .andExpect(jsonPath("$[1].title").value("i1"));
    }

    @Test
    void listIncidents_shouldReturn400_whenPageIsNegative() throws Exception {
        mockMvc.perform(get("/incidents?page=-1&size=10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listIncidents_shouldReturn400_whenSizeIsZero() throws Exception {
        mockMvc.perform(get("/incidents?page=0&size=0"))
                .andExpect(status().isBadRequest());
    }


    @Test
    void addAlert_shouldReturnAlertResponse() throws Exception {
        UUID incidentId = UUID.randomUUID();
        UUID alertId = UUID.randomUUID();

        CreationAlertDTO creation = new CreationAlertDTO("Pipe broken", Severity.CRITICAL);

        AlertDTO dto = new AlertDTO(
                alertId,
                "Pipe broken",
                Severity.CRITICAL,
                AlertStatus.OPEN
        );

        when(management.addAlertToIncident(eq(incidentId), any())).thenReturn(dto);

        mockMvc.perform(post("/incidents/" + incidentId + "/alerts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(creation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alertId.toString()))
                .andExpect(jsonPath("$.message").value("Pipe broken"))
                .andExpect(jsonPath("$.severity").value("CRITICAL"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void createIncident_shouldReturn201_andLocationHeader() throws Exception {
        UUID id = UUID.randomUUID();
        var creation = new CreationIncidentDTO("t", "d", IncidentType.MAINTENANCE);

        var dto = new IncidentDTO(id, "t", "d", IncidentType.MAINTENANCE, IncidentStatus.OPEN, List.of());

        when(management.createIncident(any())).thenReturn(dto);

        mockMvc.perform(post("/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(creation)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/incidents/" + id))
                .andExpect(header().string("Content-Type", "application/json"));
    }


    @Test
    void createIncident_shouldReturn400_whenTitleIsBlank() throws Exception {
        var dto = new CreationIncidentDTO("", "desc", IncidentType.MAINTENANCE);

        mockMvc.perform(post("/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createIncident_shouldReturn400_whenTypeIsNull() throws Exception {
        var json = """
        {"title":"Test","description":"desc","type":null}
        """;

        mockMvc.perform(post("/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }


    @Test
    void updateIncident_shouldReturnUpdatedIncident() throws Exception {
        UUID id = UUID.randomUUID();

        UpdateIncidentDTO update = new UpdateIncidentDTO("NewTitle", "NewDesc", IncidentType.MAINTENANCE);

        IncidentDTO dto = new IncidentDTO(
                id,
                "NewTitle",
                "NewDesc",
                IncidentType.MAINTENANCE,
                IncidentStatus.OPEN,
                List.of()
        );

        when(management.updateIncident(eq(id), any())).thenReturn(dto);

        mockMvc.perform(patch("/incidents/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("NewTitle"))
                .andExpect(jsonPath("$.description").value("NewDesc"))
                .andExpect(jsonPath("$.type").value("MAINTENANCE"));
    }

    @Test
    void updateAlert_shouldReturnUpdatedAlert() throws Exception {
        UUID incidentId = UUID.randomUUID();
        UUID alertId = UUID.randomUUID();

        UpdateAlertDTO update = new UpdateAlertDTO("Updated msg", Severity.LOW);

        AlertDTO dto = new AlertDTO(
                alertId,
                "Updated msg",
                Severity.LOW,
                AlertStatus.OPEN
        );

        when(management.updateAlert(eq(alertId), any())).thenReturn(dto);

        mockMvc.perform(patch("/incidents/" + incidentId + "/alerts/" + alertId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Updated msg"))
                .andExpect(jsonPath("$.severity").value("LOW"));
    }

    @Test
    void updateIncident_shouldReturn409_whenConflict() throws Exception {
        UUID id = UUID.randomUUID();
        var dto = new UpdateIncidentDTO("t", "d", IncidentType.MAINTENANCE);

        when(management.updateIncident(eq(id), any()))
                .thenThrow(new IncidentConflictException("Incident conflict exception"));

        mockMvc.perform(patch("/incidents/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

}

