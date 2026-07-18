package com.connectneighbours.admindesktop.back.infrastructure.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class OfflineAuthCacheFileImpl extends OfflineAuthCacheImpl {
    private static final File CACHE_FILE = new File(
            System.getProperty("user.home"),
            ".connect-neighbours" + File.separator + "auth-cache.json"
    );

    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    public OfflineAuthCacheFileImpl() {
        load();
    }

    @Override
    public void remember(String email, String password, String displayName, String role) {
        super.remember(email, password, displayName, role);
        persist();
    }

    private void load() {
        if (!CACHE_FILE.exists()) return;

        try {
            Map<String, CachedCredential> stored = mapper.readValue(
                    CACHE_FILE,
                    mapper.getTypeFactory().constructMapType(HashMap.class, String.class, CachedCredential.class)
            );
            data.putAll(stored);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de lire le cache d'authentification : " + CACHE_FILE, e);
        }
    }

    private void persist() {
        try {
            var dir = CACHE_FILE.getParentFile();
            if (!dir.exists()) dir.mkdirs();
            mapper.writeValue(CACHE_FILE, data);
        } catch (IOException e) {
            throw new RuntimeException("Impossible d'écrire le cache d'authentification : " + CACHE_FILE, e);
        }
    }
}
