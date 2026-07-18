package com.connectneighbours.admindesktop.back.infrastructure.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuthConfig {

    @Bean
    public OfflineAuthCache offlineAuthCache() {
        return new OfflineAuthCacheFileImpl();
    }
}
