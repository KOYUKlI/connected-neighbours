package com.connectneighbours.admindesktop.back.infrastructure.plugins;

import com.connectneighbours.admindesktop.back.infrastructure.plugins.exceptions.PluginNotFoundException;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
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

    private PluginMetaData inspect(String name) throws IOException, ClassNotFoundException, InvocationTargetException, NoSuchMethodException, InstantiationException, IllegalAccessException {
        var plugin = load(name);
        return new PluginMetaData(plugin.getName(),plugin.getVersion(),plugin.getDescription(),"main");
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
