package com.connectneighbours.admindesktop.back.exposition;

import com.connectneighbours.admindesktop.back.application.incident.service.*;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.AlertMapper;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.AlertResponseDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.CreationAlertDTO;
import com.connectneighbours.admindesktop.back.application.incident.service.alert.UpdateAlertDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/incidents")
public class IncidentController {

    private final IncidentManagement incidentManagement;

    public IncidentController(IncidentManagement incidentManagement) {
        this.incidentManagement = incidentManagement;
    }

    @GetMapping("/{id}")
    public IncidentResponseDTO getIncident(@PathVariable UUID id) {
        var dto = incidentManagement.getIncident(id);
        return IncidentMapper.toResponseDTO(dto);
    }

    @GetMapping
    public List<IncidentResponseDTO> listIncidents(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size
    ) {
        return incidentManagement.listIncidents(page, size).stream()
                .map(IncidentMapper::toResponseDTO)
                .toList();
    }

    @PostMapping
    public ResponseEntity<IncidentResponseDTO> createIncident(@RequestBody @Valid CreationIncidentDTO dto) {
        var created = incidentManagement.createIncident(dto);
        var response = IncidentMapper.toResponseDTO(created);

        return ResponseEntity
                .created(URI.create("/incidents/" + created.id()))
                .body(response);
    }



    @GetMapping("/{id}/alerts")
    public List<AlertResponseDTO> listAlerts(@PathVariable UUID id) {
        var incident = incidentManagement.getIncident(id);
        return incident.alerts().stream()
                .map(AlertMapper::toResponseDTO)
                .toList();
    }

    @PostMapping("/{id}/alerts")
    public AlertResponseDTO addAlert(
            @PathVariable UUID id,
            @RequestBody CreationAlertDTO dto
    ) {
        var alert = incidentManagement.addAlertToIncident(id, dto);
        return AlertMapper.toResponseDTO(alert);
    }

    @PatchMapping("/{id}")
    public IncidentResponseDTO updateIncident(
            @PathVariable UUID id,
            @RequestBody UpdateIncidentDTO dto
    ) {
        var updated = incidentManagement.updateIncident(id, dto);
        return IncidentMapper.toResponseDTO(updated);
    }

    @PatchMapping("/{incidentId}/alerts/{alertId}")
    public AlertResponseDTO updateAlert(
            @PathVariable UUID incidentId,
            @PathVariable UUID alertId,
            @RequestBody UpdateAlertDTO dto
    ) {
        var updated = incidentManagement.updateAlert(alertId, dto);
        return AlertMapper.toResponseDTO(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIncident(@PathVariable UUID id) {
        incidentManagement.deleteIncident(id);
    }
}

