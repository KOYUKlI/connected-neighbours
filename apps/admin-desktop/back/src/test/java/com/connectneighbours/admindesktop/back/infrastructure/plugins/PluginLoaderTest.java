package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginAlreadyExistException;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class PluginLoaderTest {

    private final PluginLoader loader = new PluginLoader();
    private final List<File> installedFiles = new ArrayList<>();

    @TempDir
    File tempDir;

    @AfterEach
    void cleanup() {
        for (File installed : installedFiles) {
            installed.delete();
        }
    }

    private File buildJar(String fileName, String pluginJson, boolean includePluginClass) throws Exception {
        File jar = new File(tempDir, fileName);

        try (JarOutputStream jos = new JarOutputStream(new FileOutputStream(jar))) {
            if (pluginJson != null) {
                jos.putNextEntry(new JarEntry("plugin.json"));
                jos.write(pluginJson.getBytes());
                jos.closeEntry();
            }

            if (includePluginClass) {
                String classResourceName = FakeInstallablePlugin.class.getSimpleName() + ".class";
                URL classUrl = FakeInstallablePlugin.class.getResource(classResourceName);
                assertNotNull(classUrl, "Compiled FakeInstallablePlugin.class not found on test classpath");

                String entryName = FakeInstallablePlugin.class.getName().replace('.', '/') + ".class";
                jos.putNextEntry(new JarEntry(entryName));
                try (var in = classUrl.openStream()) {
                    jos.write(in.readAllBytes());
                }
                jos.closeEntry();
            }
        }

        return jar;
    }

    private File installAndTrack(File source) {
        File installed = loader.installJar(source);
        installedFiles.add(installed);
        return installed;
    }

    @Test
    void inspect_shouldReturnMetadata_whenPluginJsonPresent() throws Exception {
        File jar = buildJar("with-metadata.jar", """
                {"name":"Sample","version":"2.0","description":"desc","author":"me","main":"com.example.Main"}
                """, false);

        var metadata = loader.inspect(jar);

        assertEquals("Sample", metadata.name());
        assertEquals("2.0", metadata.version());
        assertEquals("desc", metadata.description());
        assertEquals("me", metadata.author());
        assertEquals("com.example.Main", metadata.main());
    }

    @Test
    void inspect_shouldThrow_whenPluginJsonMissing() throws Exception {
        File jar = buildJar("no-metadata.jar", null, false);

        assertThrows(PluginNotFoundException.class, () -> loader.inspect(jar));
    }

    @Test
    void installJar_shouldThrow_whenSourceDoesNotExist() {
        File missing = new File(tempDir, "does-not-exist.jar");

        assertThrows(IllegalArgumentException.class, () -> loader.installJar(missing));
    }

    @Test
    void installJar_shouldThrow_whenSourceIsNull() {
        assertThrows(IllegalArgumentException.class, () -> loader.installJar(null));
    }

    @Test
    void installJar_shouldCopyIntoPluginsDirectory() throws Exception {
        File source = buildJar("installable-" + System.nanoTime() + ".jar", "{}", false);

        File installed = installAndTrack(source);

        assertTrue(installed.exists());
        assertEquals(PluginPaths.pluginsDirectory(), installed.getParentFile());
    }

    @Test
    void installJar_shouldThrow_whenAlreadyInstalled() throws Exception {
        File source = buildJar("dup-" + System.nanoTime() + ".jar", "{}", false);
        installAndTrack(source);

        assertThrows(PluginAlreadyExistException.class, () -> loader.installJar(source));
    }

    @Test
    void scan_shouldIncludeInstalledPlugin() throws Exception {
        File source = buildJar("scan-target-" + System.nanoTime() + ".jar", "{}", false);
        File installed = installAndTrack(source);

        var scanned = loader.scan();

        assertTrue(List.of(scanned).stream().anyMatch(f -> f.getName().equals(installed.getName())));
    }

    @Test
    void load_shouldReturnWorkingPluginInstance_fromRealJar() throws Exception {
        File source = buildJar("loadable-" + System.nanoTime() + ".jar", "{}", true);
        installAndTrack(source);

        Plugin plugin = loader.load(installedFiles.get(installedFiles.size() - 1));

        assertEquals("Fake Installable Plugin", plugin.getName());
        assertEquals("1.0", plugin.getVersion());
    }

    @Test
    void load_shouldThrow_whenJarNotInPluginsDirectory() {
        assertThrows(PluginNotFoundException.class, () -> loader.load(new File("never-installed.jar")));
    }
}
