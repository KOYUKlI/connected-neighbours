package com.connectneighbours.admindesktop.ui.ui.features.auth.controller;

import com.connectneighbours.admindesktop.back.application.auth.AuthManagement;
import com.connectneighbours.admindesktop.back.application.auth.SsoLoginManager;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;
import com.connectneighbours.admindesktop.ui.ui.AdminDesktopApplication;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.concurrent.CancellationException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeoutException;

public class LoginController extends VBox {

    private static final Logger log = LoggerFactory.getLogger(LoginController.class);

    @FXML
    private TextField emailField;
    @FXML
    private PasswordField passwordField;
    @FXML
    private Label errorLabel;
    @FXML
    private Button btnLogin;
    @FXML
    private Button btnSso;
    @FXML
    private Label ssoStatusLabel;
    @FXML
    private Button btnCancelSso;

    private Runnable onLoginSuccess;
    private CompletableFuture<?> pendingSsoLogin;

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
        btnSso.setOnAction(e -> attemptSsoLogin());
        btnCancelSso.setOnAction(e -> cancelSsoLogin());
    }

    public void setOnLoginSuccess(Runnable onLoginSuccess) {
        this.onLoginSuccess = onLoginSuccess;
    }

    private void attemptLogin() {
        AuthManagement authManagement = AdminDesktopApplication.getSpringContext().getBean(AuthManagement.class);

        try {
            authManagement.login(emailField.getText(), passwordField.getText());
        } catch (AuthenticationFailedException e) {
            showError(e.getMessage());
            return;
        }

        hideError();

        if (onLoginSuccess != null) {
            onLoginSuccess.run();
        }
    }

    private void attemptSsoLogin() {
        SsoLoginManager ssoLoginManager =
                AdminDesktopApplication.getSpringContext().getBean(SsoLoginManager.class);

        hideError();
        setFormDisabled(true);
        ssoStatusLabel.setVisible(true);
        ssoStatusLabel.setManaged(true);
        btnCancelSso.setVisible(true);
        btnCancelSso.setManaged(true);

        var future = ssoLoginManager.startSsoLogin();
        pendingSsoLogin = future;

        future.whenComplete((session, error) -> Platform.runLater(() -> {
            setFormDisabled(false);
            ssoStatusLabel.setVisible(false);
            ssoStatusLabel.setManaged(false);
            btnCancelSso.setVisible(false);
            btnCancelSso.setManaged(false);
            pendingSsoLogin = null;

            if (error != null) {
                if (!(error instanceof CancellationException)) {
                    log.error("SSO login failed", error);
                    showError(ssoErrorMessage(error));
                }
                return;
            }

            hideError();

            if (onLoginSuccess != null) {
                onLoginSuccess.run();
            }
        }));
    }

    private void cancelSsoLogin() {
        if (pendingSsoLogin != null) {
            pendingSsoLogin.cancel(true);
        }
    }

    private void setFormDisabled(boolean disabled) {
        emailField.setDisable(disabled);
        passwordField.setDisable(disabled);
        btnLogin.setDisable(disabled);
        btnSso.setDisable(disabled);
    }

    private String ssoErrorMessage(Throwable error) {
        if (error instanceof TimeoutException) {
            return "Délai dépassé, la connexion SSO a expiré.";
        }

        if (error instanceof AuthenticationFailedException) {
            return error.getMessage();
        }

        if (error.getMessage() != null && !error.getMessage().isBlank()) {
            return "Échec de la connexion SSO : " + error.getMessage();
        }

        return "Échec de la connexion SSO (" + error.getClass().getSimpleName() + ").";
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
        errorLabel.setManaged(true);
    }

    private void hideError() {
        errorLabel.setVisible(false);
        errorLabel.setManaged(false);
    }
}
