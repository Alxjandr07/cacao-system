package com.caco.cacao_system.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class BackupService {

    public record InfoBackup(String nombre, long tamanoBytes, LocalDateTime fecha) {}

    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private static final List<Path> PGDIR_CANDIDATOS = List.of(
            Paths.get("C:\\Program Files\\PostgreSQL\\18\\bin"),
            Paths.get("C:\\Program Files\\PostgreSQL\\17\\bin"),
            Paths.get("C:\\Program Files\\PostgreSQL\\16\\bin"),
            Paths.get("/usr/bin"),
            Paths.get("/usr/local/bin"));

    @Value("${spring.datasource.username:postgres}")
    private String dbUser;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${app.backup.dir:backups}")
    private String dirProp;

    private Path directorio() throws IOException {
        Path dir = Paths.get(dirProp).toAbsolutePath();
        Files.createDirectories(dir);
        return dir;
    }

    private String host()     { return datos().get(0); }
    private String puerto()   { return datos().get(1); }
    private String baseDatos() { return datos().get(2); }

    private List<String> datos() {
        List<String> datos = new ArrayList<>(List.of("localhost", "5432", "cacao_db"));
        try {
            if (dbUrl != null && dbUrl.startsWith("jdbc:postgresql://")) {
                String resto = dbUrl.substring("jdbc:".length());
                URI uri = new URI(resto.indexOf("?") >= 0 ? resto.substring(0, resto.indexOf("?")) : resto);
                datos.set(0, uri.getHost() == null ? "localhost" : uri.getHost());
                datos.set(1, String.valueOf(uri.getPort() > 0 ? uri.getPort() : 5432));
                String path = uri.getPath();
                String db = path == null ? "cacao_db" : path.replace("/", "");
                datos.set(2, db.isEmpty() ? "cacao_db" : db);
            }
        } catch (Exception ignored) {
        }
        return datos;
    }

    private Path binario(String nombre) {
        List<Path> candidatos = new ArrayList<>();
        for (Path dir : PGDIR_CANDIDATOS) {
            candidatos.add(dir.resolve(nombre + ".exe"));
            candidatos.add(dir.resolve(nombre));
        }
        for (Path p : candidatos) {
            if (Files.isRegularFile(p)) return p;
        }
        return Path.of(nombre);
    }

    private void ejecutar(List<String> comando) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(comando);
        pb.environment().put("PGPASSWORD", dbPassword == null ? "" : dbPassword);
        pb.redirectErrorStream(true);
        Process proceso = pb.start();
        String salida = new String(proceso.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int codigo = proceso.waitFor();
        if (codigo != 0) {
            throw new RuntimeException("El comando PostgreSQL falló (código " + codigo + "): " +
                    (salida.isBlank() ? "sin detalles" : salida));
        }
    }

    public InfoBackup generar() throws Exception {
        String nombre = "cacao_backup_" + LocalDateTime.now().format(TIMESTAMP) + ".sql";
        Path archivo = directorio().resolve(nombre);
        List<String> cmd = new ArrayList<>(List.of(
                binario("pg_dump").toString(),
                "-h", host(),
                "-p", puerto(),
                "-U", dbUser,
                "-d", baseDatos(),
                "--clean", "--if-exists",
                "--no-owner", "--no-privileges",
                "-f", archivo.toString()));
        ejecutar(cmd);
        return aInfo(archivo);
    }

    public List<InfoBackup> listar() throws IOException {
        Path dir = directorio();
        List<InfoBackup> list;
        try (Stream<Path> walk = Files.list(dir)) {
            list = walk.filter(p -> p.getFileName().toString().endsWith(".sql"))
                    .map(p -> {
                        try {
                            return aInfo(p);
                        } catch (IOException e) {
                            return null;
                        }
                    })
                    .filter(b -> b != null)
                    .toList();
        }
        return list.stream()
                .sorted(Comparator.comparing(InfoBackup::nombre).reversed())
                .toList();
    }

    private InfoBackup aInfo(Path p) throws IOException {
        return new InfoBackup(p.getFileName().toString(), Files.size(p),
                LocalDateTime.ofInstant(Files.getLastModifiedTime(p).toInstant(), java.time.ZoneId.systemDefault()));
    }

    public Path rutaDe(String nombre) throws IOException {
        if (nombre == null || !nombre.matches("[A-Za-z0-9_.-]+")
                || nombre.contains("..") || !nombre.endsWith(".sql")) {
            throw new IOException("Nombre de respaldo no válido.");
        }
        Path dir = directorio();
        return dir.resolve(nombre).normalize();
    }

    public void eliminar(String nombre) throws Exception {
        Files.deleteIfExists(rutaDe(nombre));
    }

    public void restaurar(String nombre) throws Exception {
        Path archivo = rutaDe(nombre);
        List<String> cmd = new ArrayList<>(List.of(
                binario("psql").toString(),
                "-h", host(),
                "-p", puerto(),
                "-U", dbUser,
                "-d", baseDatos(),
                "-v", "ON_ERROR_STOP=1",
                "-f", archivo.toString()));
        ejecutar(cmd);
    }
}