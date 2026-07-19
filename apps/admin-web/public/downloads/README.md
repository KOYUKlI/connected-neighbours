Place the built desktop jars here as `admin-desktop-linux.jar` and `admin-desktop-win.jar` so
`/downloads/admin-desktop-linux.jar` and `/downloads/admin-desktop-win.jar` resolve.

The jar embeds platform-specific JavaFX natives, so it must be built once per target OS
(the `javafx.platform` property picks the classifier: `linux`, `win` or `mac`).

Build both from `apps/admin-desktop`:

```
./back/mvnw -f pom.xml -DskipTests -Djavafx.platform=linux package
cp target/admin-desktop-linux-exec.jar ../admin-web/public/downloads/admin-desktop-linux.jar

./back/mvnw -f pom.xml -DskipTests -Djavafx.platform=win package
cp target/admin-desktop-win-exec.jar ../admin-web/public/downloads/admin-desktop-win.jar
```
