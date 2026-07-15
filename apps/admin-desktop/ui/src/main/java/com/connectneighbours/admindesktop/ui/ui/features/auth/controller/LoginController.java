package com.connectneighbours.admindesktop.ui.ui.features.auth.controller;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;

import java.io.IOException;

public class LoginController extends VBox {
    private static final String VALID_USERNAME = "admin";
    private static final String VALID_PASSWORD = "123";

    @FXML
    private TextField usernameField;
    @FXML
    private PasswordField passwordField;
    @FXML
    private Label errorLabel;
    @FXML
    private Button btnLogin;

    private Runnable onLoginSuccess;

    public LoginController() {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(
                "/com/connectneighbours/admindesktop/ui/ui/features/auth/view/login-view.fxml"
        ));
        loader.setRoot(this);
        loader.setController(this);
        try {
            loader.load();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @FXML
    private void initialize() {
        btnLogin.setOnAction(e -> attemptLogin());
        passwordField.setOnAction(e -> attemptLogin());
    }

    public void setOnLoginSuccess(Runnable onLoginSuccess) {
        this.onLoginSuccess = onLoginSuccess;
    }

    private void attemptLogin() {
        boolean valid = VALID_USERNAME.equals(usernameField.getText())
                && VALID_PASSWORD.equals(passwordField.getText());

        if (!valid) {
            errorLabel.setVisible(true);
            errorLabel.setManaged(true);
            return;
        }

        errorLabel.setVisible(false);
        errorLabel.setManaged(false);

        if (onLoginSuccess != null) {
            onLoginSuccess.run();
        }
    }
}
