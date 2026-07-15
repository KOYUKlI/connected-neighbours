package com.connectneighbours.admindesktop.ui.ui;

import com.connectneighbours.admindesktop.ui.ui.features.auth.controller.LoginController;
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
    public void start(Stage stage) {
        LoginController loginController = new LoginController();
        loginController.setOnLoginSuccess(() -> showAdminDesktop(stage));

        Scene scene = new Scene(loginController, 1100, 700);
        stage.setScene(scene);
        stage.setTitle("Connect Neighbours - Connexion");
        stage.show();
    }

    private void showAdminDesktop(Stage stage) {
        try {
            FXMLLoader loader = new FXMLLoader(
                    AdminDesktopApplication.class.getResource("admin-desktop-view.fxml")
            );
            loader.setControllerFactory(AdminDesktopApplication.getSpringContext()::getBean);
            Scene scene = new Scene(loader.load(), 1100, 700);
            stage.setScene(scene);
            stage.setTitle("Connect Neighbours");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static ApplicationContext getSpringContext() {
        return springContext;
    }
}



