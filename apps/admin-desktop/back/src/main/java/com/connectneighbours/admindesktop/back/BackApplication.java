package com.connectneighbours.admindesktop.back;

import com.connectneighbours.admindesktop.ui.ui.HelloApplication;
import javafx.application.Application;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

@SpringBootApplication(scanBasePackages = "com.connectneighbours.admindesktop")
public class BackApplication {
	public static void main(String[] args) {
        var ctx = SpringApplication.run(BackApplication.class, args);
        HelloApplication.setSpringContext(ctx);
        Application.launch(HelloApplication.class, args);
	}
}
