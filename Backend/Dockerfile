# Build a small production image without any AWS tooling.
# Render builds this Dockerfile directly (see render.yaml at repo root).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# Cache dependencies in their own layer.
RUN ./mvnw -B -q dependency:go-offline
COPY src/ src/
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
# Run as non-root; Render mounts the persistent disk at /var/chatx-uploads.
RUN useradd -m appuser && mkdir -p /var/chatx-uploads && chown appuser /var/chatx-uploads
COPY --from=build /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
