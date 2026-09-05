package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.service.SueldoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/personal")
@RequiredArgsConstructor
public class SueldoController {

    private final SueldoService sueldoService;

    // ── SUELDOS POR TIPO (por empleado) ──────────────────────────

    @GetMapping("/{id}/sueldos")
    public ResponseEntity<?> sueldosDePersonal(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(sueldoService.listarSueldosConResumen(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/sueldos")
    public ResponseEntity<?> guardarSueldo(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        try {
            TipoActividad tipo = TipoActividad.valueOf(String.valueOf(body.get("tipo")));
            BigDecimal sueldo = new BigDecimal(String.valueOf(body.get("sueldoDiario")));
            return ResponseEntity.ok(sueldoService.guardarSueldo(id, tipo, sueldo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo de actividad o sueldo inválido."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/sueldos/{sueldoId}")
    public ResponseEntity<Map<String, Object>> eliminarSueldo(@PathVariable Long sueldoId) {
        try {
            sueldoService.eliminarSueldo(sueldoId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se pudo eliminar el sueldo."));
        }
    }

    // ── PAGOS / ASIGNACIONES ─────────────────────────────────────

    @GetMapping("/pagos")
    public ResponseEntity<List<ActividadPersonal>> listarPagos(
            @RequestParam(required = false) Long personalId) {
        return ResponseEntity.ok(sueldoService.listarPagos(personalId));
    }

    @GetMapping("/pagos/resumen")
    public ResponseEntity<List<Map<String, Object>>> resumenPorEmpleado() {
        return ResponseEntity.ok(sueldoService.resumenPorEmpleado());
    }

    @PostMapping("/pagos")
    public ResponseEntity<?> asignarEmpleado(@RequestBody Map<String, Long> body) {
        try {
            Long personalId = body.get("personalId");
            Long actividadId = body.get("actividadId");
            if (personalId == null || actividadId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Faltan datos de la asignación."));
            }
            return ResponseEntity.ok(sueldoService.asignarEmpleadoAActividad(personalId, actividadId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/pagos/{id}/estado")
    public ResponseEntity<?> cambiarEstadoPago(@PathVariable Long id,
                                               @RequestBody Map<String, Object> body) {
        try {
            EstadoPago estado = EstadoPago.valueOf(String.valueOf(body.get("estado")));
            LocalDate fechaPago = body.get("fechaPago") != null
                    ? LocalDate.parse(String.valueOf(body.get("fechaPago"))) : null;
            return ResponseEntity.ok(sueldoService.cambiarEstadoPago(id, estado, fechaPago));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado de pago inválido."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/pagos/{id}")
    public ResponseEntity<Map<String, Object>> eliminarPago(@PathVariable Long id) {
        try {
            sueldoService.eliminarPago(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se pudo eliminar la asignación."));
        }
    }
}
