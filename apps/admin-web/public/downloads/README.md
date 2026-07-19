Place the built desktop jar here as `admin-desktop.jar` so `/downloads/admin-desktop.jar` resolves.

Build it from `apps/admin-desktop`:

```
./back/mvnw -f pom.xml -DskipTests package
cp target/admin-desktop-1.0-SNAPSHOT-exec.jar ../admin-web/public/downloads/admin-desktop.jar
```
