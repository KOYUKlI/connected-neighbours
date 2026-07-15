package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.application.incident.IncidentManagement;
import com.connectneighbours.admindesktop.back.application.incident.alert.AlertManagement;
import com.connectneighbours.admindesktop.back.application.reporter.ReporterManagement;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PluginManagementTest {
    private PluginRepository pluginRepository;

    private PluginLoader pluginLoader;

    @Mock
    private IncidentManagement incidentManagement;
    @Mock
    private AlertManagement alertManagement;
    @Mock
    private ReporterManagement reporterManagement;

    private PluginManagement pluginManagement;

    @BeforeEach
    void setup() {
        this.pluginLoader = new FakePluginLoader();
        this.pluginRepository = new PluginRepositoryImpl();

        lenient().when(incidentManagement.listIncidents(anyInt(), anyInt())).thenReturn(List.of());
        lenient().when(alertManagement.listAlerts()).thenReturn(List.of());
        lenient().when(reporterManagement.listReporters()).thenReturn(List.of());

        this.pluginManagement = new PluginManagement(pluginRepository, pluginLoader, incidentManagement, alertManagement, reporterManagement);
    }


    @Test
    void testInstall() {
        File jar = new File("fake.jar");

        PluginDTO result = pluginManagement.install(jar);

        assertEquals("FakePlugin", result.name());
        assertEquals("1.0", result.version());
        assertEquals(StatePlugin.ACTIVATE, result.statePlugin());
        assertEquals("FakePlugin", result.mainClass());
    }

    @Test
    void testInstallInspectFails() {
        PluginLoader loader = mock(PluginLoader.class);
        when(loader.installJar(any())).thenReturn(new File("fake.jar"));
        when(loader.inspect(any())).thenThrow(new RuntimeException("invalid"));

        PluginManagement pm = new PluginManagement(pluginRepository, loader, incidentManagement, alertManagement, reporterManagement);

        assertThrows(RuntimeException.class, () -> {
            pm.install(new File("fake.jar"));
        });
    }


    @Test
    void testLoad() throws Exception {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);


        PluginDTO loaded = pluginManagement.load(installed.uuid());

        assertEquals(StatePlugin.ACTIVATE, loaded.statePlugin());
    }

    @Test
    void testLoadUnknownPlugin() {
        UUID unknown = UUID.randomUUID();

        assertThrows(PluginNotFoundException.class, () -> {
            pluginManagement.load(unknown);
        });
    }


    @Test
    void testExecute() throws Exception {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        PluginDTO result = pluginManagement.execute(installed.uuid());

        assertEquals(StatePlugin.ACTIVATE, result.statePlugin());

        assertTrue(pluginManagement.getLogs().stream().anyMatch(line -> line.contains("test")));
        verify(incidentManagement, times(1)).listIncidents(0, Integer.MAX_VALUE);
        verify(alertManagement, times(1)).listAlerts();
        verify(reporterManagement, times(1)).listReporters();
    }

    @Test
    void testExecuteLoadFails() throws Exception {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        PluginLoader failingLoader = mock(PluginLoader.class);
        when(failingLoader.load(any())).thenThrow(new ClassNotFoundException());

        PluginManagement pm = new PluginManagement(pluginRepository, failingLoader, incidentManagement, alertManagement, reporterManagement);

        assertThrows(ClassNotFoundException.class, () -> {
            pm.execute(installed.uuid());
        });
    }

    @Test
    void testLoadDoesNotChangeMetadata() throws Exception {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        PluginDTO loaded = pluginManagement.load(installed.uuid());

        assertEquals(installed.uuid(), loaded.uuid());
        assertEquals(installed.name(), loaded.name());
        assertEquals(installed.version(), loaded.version());
        assertEquals(installed.author(), loaded.author());
        assertEquals(installed.description(), loaded.description());
        assertEquals(installed.path(), loaded.path());
        assertEquals(installed.mainClass(), loaded.mainClass());

        assertEquals(StatePlugin.ACTIVATE, loaded.statePlugin());
    }


    @Test
    void testExecuteFailsWhenPluginIsDeactivated() {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        pluginManagement.deactivate(installed.uuid());

        assertThrows(IllegalStateException.class, () -> {
            pluginManagement.execute(installed.uuid());
        });
    }


    @Test
    void testExecutePluginThrows() throws Exception {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        Plugin failingPlugin = mock(Plugin.class);
        doThrow(new RuntimeException("boom")).when(failingPlugin).execute(any());

        PluginLoader loader = mock(PluginLoader.class);
        when(loader.load(any())).thenReturn(failingPlugin);

        PluginManagement pm = new PluginManagement(pluginRepository, loader, incidentManagement, alertManagement, reporterManagement);

        assertThrows(RuntimeException.class, () -> {
            pm.execute(installed.uuid());
        });
    }


    @Test
    void testDeactivate() {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        PluginDTO deactivated = pluginManagement.deactivate(installed.uuid());

        assertEquals(StatePlugin.DEACTIVATE, deactivated.statePlugin());
    }

    @Test
    void testDeactivateAlreadyDeactivated() {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        pluginManagement.deactivate(installed.uuid());
        PluginDTO again = pluginManagement.deactivate(installed.uuid());

        assertEquals(StatePlugin.DEACTIVATE, again.statePlugin());
    }

    @Test
    void testDeactivateOnlyChangesState() {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        PluginDTO deactivated = pluginManagement.deactivate(installed.uuid());

        assertEquals(installed.uuid(), deactivated.uuid());
        assertEquals(installed.name(), deactivated.name());
        assertEquals(installed.version(), deactivated.version());
        assertEquals(installed.author(), deactivated.author());
        assertEquals(installed.description(), deactivated.description());
        assertEquals(installed.path(), deactivated.path());
        assertEquals(installed.mainClass(), deactivated.mainClass());

        assertEquals(StatePlugin.DEACTIVATE, deactivated.statePlugin());
    }

    @Test
    void testDelete() {
        File jar = new File("fake.jar");
        PluginDTO installed = pluginManagement.install(jar);

        pluginManagement.delete(installed.uuid());

        assertTrue(pluginRepository.findAll().isEmpty());
    }

}
