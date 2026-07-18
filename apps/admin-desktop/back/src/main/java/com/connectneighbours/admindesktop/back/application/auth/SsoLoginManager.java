package com.connectneighbours.admindesktop.back.application.auth;

import com.connectneighbours.admindesktop.back.domain.auth.AuthClient;
import com.connectneighbours.admindesktop.back.domain.auth.AuthenticatedSession;
import com.connectneighbours.admindesktop.back.domain.exception.auth.AuthenticationFailedException;
import com.connectneighbours.admindesktop.back.infrastructure.auth.SessionContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Desktop;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class SsoLoginManager {

    private static final Logger log = LoggerFactory.getLogger(SsoLoginManager.class);
    private static final int TIMEOUT_SECONDS = 180;

    private final AuthClient authClient;
    private final SessionContext sessionContext;
    private final String webBaseUrl;
    private final SecureRandom random = new SecureRandom();

    public SsoLoginManager(AuthClient authClient, SessionContext sessionContext,
                            @Value("${web.base-url}") String webBaseUrl) {
        this.authClient = authClient;
        this.sessionContext = sessionContext;
        this.webBaseUrl = webBaseUrl;
    }

    public CompletableFuture<AuthenticatedSession> startSsoLogin() {
        CompletableFuture<AuthenticatedSession> future = new CompletableFuture<>();

        String state = randomToken();
        String codeVerifier = randomToken();
        String codeChallenge = codeChallenge(codeVerifier);

        HttpServer server;
        try {
            server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        } catch (IOException e) {
            log.error("Failed to start the local SSO callback server", e);
            future.completeExceptionally(e);
            return future;
        }

        int port = server.getAddress().getPort();
        String callbackUrl = "http://127.0.0.1:" + port + "/callback";

        server.createContext("/callback", exchange ->
                handleCallback(exchange, state, codeVerifier, future));
        server.start();

        future.whenComplete((result, error) -> server.stop(0));
        future.orTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        if (!Desktop.isDesktopSupported() || !Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            log.error("java.awt.Desktop BROWSE action is not supported on this environment");
            future.completeExceptionally(
                    new IllegalStateException("Unable to open the system browser on this environment"));
            return future;
        }

        try {
            Desktop.getDesktop().browse(URI.create(
                    webBaseUrl + "/desktop-login"
                            + "?state=" + urlEncode(state)
                            + "&callback=" + urlEncode(callbackUrl)
                            + "&codeChallenge=" + urlEncode(codeChallenge)
            ));
        } catch (Exception e) {
            log.error("Failed to open the system browser for SSO login", e);
            future.completeExceptionally(e);
        }

        return future;
    }

    private void handleCallback(HttpExchange exchange, String expectedState, String codeVerifier,
                                 CompletableFuture<AuthenticatedSession> future) {
        try {
            Map<String, String> params = parseQuery(exchange.getRequestURI());
            String receivedState = params.get("state");
            String code = params.get("code");

            if (code == null || receivedState == null || !receivedState.equals(expectedState)) {
                respond(exchange, 400, "Requête de connexion invalide.");
                future.completeExceptionally(new AuthenticationFailedException("Invalid SSO callback"));
                return;
            }

            var session = authClient.exchangeSsoCode(code, codeVerifier);

            if (!session.isAdmin()) {
                respond(exchange, 403, "Ce compte n'a pas les droits administrateur.");
                future.completeExceptionally(
                        new AuthenticationFailedException("This account does not have the admin role"));
                return;
            }

            sessionContext.setCurrentSession(session);
            respond(exchange, 200, "Connexion réussie, vous pouvez fermer cet onglet.");
            future.complete(session);
        } catch (Exception e) {
            log.error("SSO callback handling failed", e);
            respondSilently(exchange, 500, "Erreur lors de la connexion.");
            future.completeExceptionally(e);
        } finally {
            exchange.close();
        }
    }

    private void respondSilently(HttpExchange exchange, int status, String message) {
        try {
            respond(exchange, status, message);
        } catch (IOException ignored) {
        }
    }

    private void respond(HttpExchange exchange, int status, String message) throws IOException {
        byte[] body = ("<html><body><p>" + message + "</p></body></html>")
                .getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "text/html; charset=utf-8");
        exchange.sendResponseHeaders(status, body.length);

        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body);
        }
    }

    private Map<String, String> parseQuery(URI uri) {
        String query = uri.getRawQuery();

        if (query == null || query.isBlank()) {
            return Map.of();
        }

        return Arrays.stream(query.split("&"))
                .map(pair -> pair.split("=", 2))
                .collect(Collectors.toMap(
                        pair -> urlDecode(pair[0]),
                        pair -> pair.length > 1 ? urlDecode(pair[1]) : "",
                        (first, second) -> second
                ));
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String codeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String urlDecode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
