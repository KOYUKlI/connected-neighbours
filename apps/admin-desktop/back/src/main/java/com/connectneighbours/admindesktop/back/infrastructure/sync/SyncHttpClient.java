package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.application.sync.CentralPullResponse;
import com.connectneighbours.admindesktop.back.application.sync.CentralPushRequest;
import com.connectneighbours.admindesktop.back.application.sync.CentralPushResponse;
import com.connectneighbours.admindesktop.back.domain.exception.sync.SyncFailedException;
import com.connectneighbours.admindesktop.back.infrastructure.auth.SessionContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class SyncHttpClient {

    private final RestTemplate restTemplate;
    private final SessionContext sessionContext;
    private final String baseUrl;

    public SyncHttpClient(RestTemplateBuilder builder,
                           SessionContext sessionContext,
                           @Value("${api.base-url}") String baseUrl) {
        this.restTemplate = builder.build();
        this.sessionContext = sessionContext;
        this.baseUrl = baseUrl;
    }

    public CentralPushResponse push(CentralPushRequest request) {
        try {
            var response = restTemplate.exchange(
                    baseUrl + "/sync/push",
                    HttpMethod.POST,
                    new HttpEntity<>(request, authHeaders()),
                    CentralPushResponse.class
            ).getBody();

            if (response == null) {
                throw new SyncFailedException("Empty push response from central server");
            }

            return response;
        } catch (RestClientException e) {
            throw new SyncFailedException("Unable to push to the central server: " + e.getMessage());
        }
    }

    public CentralPullResponse pull(String clientId, String since) {
        try {
            var uriBuilder = UriComponentsBuilder.fromHttpUrl(baseUrl + "/sync/pull")
                    .queryParam("clientId", clientId);

            if (since != null) {
                uriBuilder.queryParam("since", since);
            }

            var response = restTemplate.exchange(
                    uriBuilder.toUriString(),
                    HttpMethod.GET,
                    new HttpEntity<>(authHeaders()),
                    CentralPullResponse.class
            ).getBody();

            if (response == null) {
                throw new SyncFailedException("Empty pull response from central server");
            }

            return response;
        } catch (RestClientException e) {
            throw new SyncFailedException("Unable to pull from the central server: " + e.getMessage());
        }
    }

    private HttpHeaders authHeaders() {
        var token = sessionContext.getAccessToken();

        if (token == null) {
            throw new SyncFailedException("Not authenticated against the central server");
        }

        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }
}
