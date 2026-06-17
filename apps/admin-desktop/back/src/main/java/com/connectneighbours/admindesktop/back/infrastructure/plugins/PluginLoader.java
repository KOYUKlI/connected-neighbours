package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginAlreadyExistException;
import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.Collections;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

public class PluginLoader {
    public PluginLoader() {
    }

    public Plugin load(File jarFile) throws IOException, NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException, ClassNotFoundException {
        var name = jarFile.getName();
        var file = findJarByName(name);
        var cl = new URLClassLoader(new URL[]{file.toURI().toURL()},this.getClass().getClassLoader());
        var pluginClassName = findPluginClassInJar(file,cl);
        var clazz = cl.loadClass(pluginClassName);
        return (Plugin) clazz.getDeclaredConstructor().newInstance();
    }

    public File[] scan() {
        var file = new File("/plugins/output");
        return file.listFiles();
    }

    public PluginMetaData inspect(File pluginFile) {
        try(JarFile jar = new JarFile(pluginFile)) {
            var entry = jar.getJarEntry("plugin.json");
            if(entry == null) throw new PluginNotFoundException("Plugin not found with name :" + pluginFile.getName());
            try(InputStream inputStream = jar.getInputStream(entry)) {
                var json = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                return new ObjectMapper().readValue(json,PluginMetaData.class);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public File installJar(File sourceJar) {
        if (sourceJar == null || !sourceJar.exists()) {
            throw new IllegalArgumentException("Source JAR does not exist: " + sourceJar);
        }

        File pluginsDir = new File("/plugins/output");
        if (!pluginsDir.exists()) pluginsDir.mkdirs();


        File dst = new File(pluginsDir, sourceJar.getName());

        if (dst.exists()) {
            throw new PluginAlreadyExistException("Plugin already installed: " + dst.getName());
        }

        try {
            Files.copy(sourceJar.toPath(), dst.toPath());
        } catch (IOException e) {
            throw new RuntimeException("Failed to install plugin: " + sourceJar.getName(), e);
        }

        return dst;
    }


    private File findJarByName(String name) {
        var plugins = Arrays.stream(scan()).toList();
        return plugins.stream().filter(f -> f.getName().equals(name)).findFirst().orElseThrow(() -> new PluginNotFoundException("Plugin not found with name : " + name));
    }

    private String findPluginClassInJar(File jarFile,URLClassLoader cl) {
        try(JarFile jar = new JarFile(jarFile)) {
            for(JarEntry entry : Collections.list(jar.entries())) {
              if(entry.getName().endsWith(".class")){
                  var className = entry.getName().replace("/",".").replace(".class","");
                  var clazz = cl.loadClass(className);
                  if (Plugin.class.isAssignableFrom(clazz) && !clazz.isInterface()){
                      return className;
                  }
              }

            }

        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
        throw new PluginNotFoundException("No Plugin class found in jar: " + jarFile.getName());
    }

}
