package com.connectneighbours.admindesktop.back;

import com.connectneighbours.admindesktop.ui.ui.AdminDesktopApplication;
import javafx.application.Application;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.connectneighbours.admindesktop")
public class BackApplication {
	public static void main(String[] args) {
        System.setProperty("java.awt.headless", "false");

        var ctx = SpringApplication.run(BackApplication.class, args);
        AdminDesktopApplication.setSpringContext(ctx);
        Application.launch(AdminDesktopApplication.class, args);
	}
}
