# ── Build ──
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

# ── Runtime ──
FROM eclipse-temurin:21-jre
# pg_dump para el módulo de respaldos
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/cacao-system-0.0.1-SNAPSHOT.jar app.jar
ENV APP_BACKUP_DIR=/data/backups
VOLUME ["/data/backups"]
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
