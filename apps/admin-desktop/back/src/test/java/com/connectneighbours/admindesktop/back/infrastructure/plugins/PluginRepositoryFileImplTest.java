package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PluginRepositoryFileImplTest {

    private static final File REGISTRY_FILE = new File(PluginPaths.pluginsDirectory(), "registry.json");

    private byte[] originalRegistryContent;
    private boolean registryExistedBefore;

    @BeforeEach
    void backupRealRegistry() throws Exception {
        registryExistedBefore = REGISTRY_FILE.exists();
        if (registryExistedBefore) {
            originalRegistryContent = Files.readAllBytes(REGISTRY_FILE.toPath());
        }
    }

    @AfterEach
    void restoreRealRegistry() throws Exception {
        if (registryExistedBefore) {
            Files.write(REGISTRY_FILE.toPath(), originalRegistryContent);
        } else {
            REGISTRY_FILE.delete();
        }
    }

    private PluginDTO newPlugin(String name, String author, StatePlugin state) {
        return new PluginDTO(UUID.randomUUID(), name, "1.0", author, "desc", "/path", "Main", state);
    }

    @Test
    void save_shouldPersistToRealRegistryFile() {
        var repo = new PluginRepositoryFileImpl();
        var plugin = newPlugin("Sample", "me", StatePlugin.ACTIVATE);

        repo.save(plugin);

        assertTrue(REGISTRY_FILE.exists());
        assertTrue(new PluginRepositoryFileImpl().findById(plugin.uuid()).isPresent());
    }

    @Test
    void findById_shouldReturnEmpty_whenUnknown() {
        var repo = new PluginRepositoryFileImpl();

        assertTrue(repo.findById(UUID.randomUUID()).isEmpty());
    }

    @Test
    void delete_shouldRemovePlugin() {
        var repo = new PluginRepositoryFileImpl();
        var plugin = newPlugin("Sample", "me", StatePlugin.ACTIVATE);
        repo.save(plugin);

        repo.delete(plugin.uuid());

        assertTrue(new PluginRepositoryFileImpl().findById(plugin.uuid()).isEmpty());
    }

    @Test
    void findByName_shouldReturnMatchingPlugins() {
        var repo = new PluginRepositoryFileImpl();
        repo.save(newPlugin("Sample", "me", StatePlugin.ACTIVATE));
        repo.save(newPlugin("Other", "me", StatePlugin.ACTIVATE));

        var result = repo.findByName("Sample");

        assertEquals(1, result.size());
        assertEquals("Sample", result.get(0).name());
    }

    @Test
    void findByAuthor_shouldReturnMatchingPlugins() {
        var repo = new PluginRepositoryFileImpl();
        repo.save(newPlugin("Sample", "alice", StatePlugin.ACTIVATE));
        repo.save(newPlugin("Other", "bob", StatePlugin.ACTIVATE));

        var result = repo.findByAuthor("alice");

        assertEquals(1, result.size());
        assertEquals("alice", result.get(0).author());
    }

    @Test
    void findByStatePlugin_shouldReturnMatchingPlugins() {
        var repo = new PluginRepositoryFileImpl();
        repo.save(newPlugin("Sample", "alice", StatePlugin.ACTIVATE));
        repo.save(newPlugin("Other", "bob", StatePlugin.DEACTIVATE));

        var result = repo.findByStatePlugin(StatePlugin.DEACTIVATE);

        assertEquals(1, result.size());
        assertEquals("Other", result.get(0).name());
    }

    @Test
    void newInstance_shouldLoadPreviouslyPersistedPlugins() {
        var repo = new PluginRepositoryFileImpl();
        var plugin = newPlugin("Persisted", "me", StatePlugin.ACTIVATE);
        repo.save(plugin);

        var freshRepo = new PluginRepositoryFileImpl();

        assertTrue(freshRepo.findById(plugin.uuid()).isPresent());
    }
}
