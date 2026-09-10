package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.BackupConfiguracion;
import com.caco.cacao_system.service.AuditoriaService;
import com.caco.cacao_system.service.BackupConfiguracionService;
import com.caco.cacao_system.service.BackupService;
import com.caco.cacao_system.service.BackupService.InfoBackup;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/backups")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService backupService;
    private final BackupConfiguracionService configuracionService;
    private final AuditoriaService auditoriaService;

    @GetMapping("/config")
    public BackupConfiguracion getConfig() {
        return configuracionService.obtener();
    }

    @PutMapping("/config")
    public ResponseEntity<?> guardarConfig(@RequestBody Map<String, Object> body,
                                           HttpServletRequest request) {
        try {
            String frecuencia = (String) body.get("frecuencia");
            LocalTime hora = LocalTime.parse((String) body.get("hora"));
            Integer diaSemana = body.get("diaSemana") == null ? null
                    : Integer.parseInt(String.valueOf(body.get("diaSemana")));
            Integer diaMes = body.get("diaMes") == null ? null
                    : Integer.parseInt(String.valueOf(body.get("diaMes")));
            boolean activo = body.get("activo") != null && Boolean.parseBoolean(String.valueOf(body.get("activo")));

            BackupConfiguracion guardada = configuracionService.guardar(
                    frecuencia, hora, diaSemana, diaMes, activo);

            auditoriaService.registrar(
                    AuditoriaService.usuarioDe(request), "CONFIGURAR_BACKUP", "base_datos", guardada.getId(),
                    "Programación de respaldos guardada: " + guardada.getFrecuencia()
                            + " a las " + guardada.getHora()
                            + (guardada.getDiaSemana() != null ? " — día " + guardada.getDiaSemana() : "")
                            + (guardada.getDiaMes() != null ? " — día " + guardada.getDiaMes() : "")
                            + (Boolean.TRUE.equals(guardada.getActivo()) ? " (Activa)" : " (Desactivada)"),
                    AuditoriaService.ipDe(request));

            return ResponseEntity.ok(guardada);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No se pudo guardar la programación: " + e.getMessage()));
        }
    }

    @PostMapping("/export")
    public ResponseEntity<?> exportar(HttpServletRequest request) {
        try {
            InfoBackup b = backupService.generar();
            auditoriaService.registrar(
                    AuditoriaService.usuarioDe(request), "RESPALDO", "base_datos", null,
                    "Respaldo generado: " + b.nombre() + " (" + b.tamanoBytes() + " bytes)",
                    AuditoriaService.ipDe(request));
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Respaldo generado correctamente",
                    "archivo", b.nombre(),
                    "tamanoBytes", b.tamanoBytes(),
                    "fecha", b.fecha().toString()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al generar el respaldo: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        try {
            List<InfoBackup> backups = backupService.listar();
            return ResponseEntity.ok(backups);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al listar respaldos: " + e.getMessage()));
        }
    }

    @GetMapping("/download/{nombre}")
    public ResponseEntity<byte[]> descargar(@PathVariable String nombre) {
        try {
            Path p = backupService.rutaDe(nombre);
            byte[] datos = Files.readAllBytes(p);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(datos);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{nombre}")
    public ResponseEntity<?> eliminar(@PathVariable String nombre, HttpServletRequest request) {
        try {
            backupService.eliminar(nombre);
            auditoriaService.registrar(
                    AuditoriaService.usuarioDe(request), "ELIMINAR_BACKUP", "base_datos", null,
                    "Respaldo eliminado: " + nombre,
                    AuditoriaService.ipDe(request));
            return ResponseEntity.ok(Map.of("mensaje", "Respaldo eliminado"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al eliminar el respaldo: " + e.getMessage()));
        }
    }

    @PostMapping("/restore/{nombre}")
    public ResponseEntity<?> restaurar(@PathVariable String nombre, HttpServletRequest request) {
        try {
            backupService.restaurar(nombre);
            auditoriaService.registrar(
                    AuditoriaService.usuarioDe(request), "RESTAURACION", "base_datos", null,
                    "Base de datos restaurada desde: " + nombre,
                    AuditoriaService.ipDe(request));
            return ResponseEntity.ok(Map.of("mensaje", "Base de datos restaurada correctamente desde " + nombre));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al restaurar la base de datos: " + e.getMessage()));
        }
    }
}