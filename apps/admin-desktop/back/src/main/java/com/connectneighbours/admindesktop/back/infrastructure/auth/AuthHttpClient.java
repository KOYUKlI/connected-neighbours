package com.connectneighbours.admindesktop.back.infrastructure.auth;

import com.connectneighbours.admindesktop.back.application.auth.LoginRequestBody;
import com.connectneighbours.admindesktop.back.application.auth.LoginResponseBody;
import com.connectneighbours.admindesktop.back.domain.auth.AuthClient;
import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class AuthHttpClient implements AuthClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public AuthHttpClient(RestTemplateBuilder builder,
                           @Value("${api.base-url}") String baseUrl) {
        this.restTemplate = builder.build();
        this.baseUrl = baseUrl;
    }

    @Override
    public AuthenticatedSession login(String email, String password) {
        try {
            var response = restTemplate.postForObject(
                    baseUrl + "/auth/login",
                    new LoginRequestBody(email, password),
                    LoginResponseBody.class
            );

            if (response == null || response.accessToken() == null || response.user() == null) {
                throw new AuthenticationFailedException("Invalid response from central server");
            }

            return new AuthenticatedSession(
                    response.accessToken(),
                    response.user().email(),
                    response.user().displayName(),
                    response.user().role()
            );
        } catch (HttpClientErrorException e) {
            throw new AuthenticationFailedException("Invalid credentials");
        } catch (RestClientException e) {
            throw new AuthenticationFailedException("Unable to reach the central server");
        }
    }
}
