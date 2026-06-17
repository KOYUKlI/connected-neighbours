package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

public class PluginLoader {
    public PluginLoader() {
    }

    public Plugin load(String name) throws IOException, NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException, ClassNotFoundException {
        var file = findJarByName(name);
        var cl = new URLClassLoader(new URL[]{file.toURI().toURL()},this.getClass().getClassLoader());
        var pluginClassName = findPluginClassInJar(file,cl);
        var clazz = cl.loadClass(pluginClassName);
        return (Plugin) clazz.getDeclaredConstructor().newInstance();
    }

    public File[] scan() {
        var file = new File("/plugins");
        return file.listFiles();
    }

    public PluginMetaData inspect(String name) {
        var file = findJarByName(name);
        try(JarFile jar = new JarFile(file)) {
            var entry = jar.getJarEntry("plugin.json");
            if(entry == null) throw new PluginNotFoundException("Plugin not found with name :" +name);
            try(InputStream inputStream = jar.getInputStream(entry)) {
                var json = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                return new ObjectMapper().readValue(json,PluginMetaData.class);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private File findJarByName(String name) {
        var plugins = Arrays.stream(scan()).toList();
        return plugins.stream().filter(f -> f.getName().equals(name)).findFirst().orElseThrow(() -> new PluginNotFoundException("Plugin not found with name : " + name));
    }

    private String findPluginClassInJar(File jarFile,URLClassLoader cl) throws MalformedURLException {
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
