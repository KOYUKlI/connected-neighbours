package com.connectneighbours.admindesktop.back.exposition.sync;

import com.connectneighbours.admindesktop.back.application.sync.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncManagement syncManagement;

    public SyncController(SyncManagement syncManagement) {
        this.syncManagement = syncManagement;
    }

    @PostMapping("/push")
    public void push(@RequestBody SyncPushRequestDTO request) {
        syncManagement.push(request);
    }

    @GetMapping("/pull")
    public SyncPullResponseDTO pull(@RequestParam String clientId,
                                    @RequestParam(required = false) String since) {
        return syncManagement.pull(clientId, since);
    }

    @GetMapping("/status")
    public SyncStatusDTO status(@RequestParam String clientId) {
        return syncManagement.status(clientId);
    }

    @GetMapping("/history")
    public List<SyncHistoryDTO> history(@RequestParam String clientId) {
        return syncManagement.history(clientId);
    }
}

