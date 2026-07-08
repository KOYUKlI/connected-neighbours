package com.connectneighbours.admindesktop.ui.ui;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.springframework.context.ApplicationContext;

import java.io.IOException;

public class AdminDesktopApplication extends Application {

    private static ApplicationContext springContext;

    public static void setSpringContext(ApplicationContext ctx) {
        springContext = ctx;
    }

    @Override
    public void start(Stage stage) throws IOException {
        FXMLLoader loader = new FXMLLoader(
                AdminDesktopApplication.class.getResource("admin-desktop-view.fxml")
        );
        loader.setControllerFactory(AdminDesktopApplication.getSpringContext()::getBean);
        Scene scene = new Scene(loader.load());
        stage.setScene(scene);
        stage.setWidth(1100);
        stage.setHeight(700);
        stage.show();
    }

    public static ApplicationContext getSpringContext() {
        return springContext;
    }
}



