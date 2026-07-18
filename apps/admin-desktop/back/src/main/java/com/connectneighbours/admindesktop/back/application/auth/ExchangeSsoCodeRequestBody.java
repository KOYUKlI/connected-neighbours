package com.connectneighbours.admindesktop.back.application.auth;

public record ExchangeSsoCodeRequestBody(String code, String codeVerifier) {}
