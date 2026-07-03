package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.application.sync.SyncPushRequestDTO;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SyncHttpClient {

    private final RestTemplate restTemplate;
    private final String baseUrl = "http://localhost:5173/api/sync";
    private final String clientId = "desktop-1";

    public SyncHttpClient(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public void push(SyncPushRequestDTO request) {
        restTemplate.postForEntity(baseUrl + "/push", request, Void.class);
    }


}

