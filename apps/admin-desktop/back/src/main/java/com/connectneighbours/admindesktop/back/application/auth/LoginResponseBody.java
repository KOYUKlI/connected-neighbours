package com.connectneighbours.admindesktop.back.application.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LoginResponseBody(String accessToken, UserBody user) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UserBody(String email, String displayName, String role) {}
}
