package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.CalidadGrano;
import com.caco.cacao_system.model.RegistroCosecha;
import com.caco.cacao_system.service.CosechaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cosecha")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CosechaController {

    private final CosechaService cosechaService;

    @GetMapping
    public ResponseEntity<List<RegistroCosecha>> listarTodos() {
        return ResponseEntity.ok(cosechaService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistroCosecha> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(cosechaService.obtenerPorId(id));
    }

    @GetMapping("/parcela/{parcelaId}")
    public ResponseEntity<List<RegistroCosecha>> historialPorParcela(@PathVariable Long parcelaId) {
        return ResponseEntity.ok(cosechaService.historialPorParcela(parcelaId));
    }

    @GetMapping("/calidad/{calidad}")
    public ResponseEntity<List<RegistroCosecha>> porCalidad(@PathVariable CalidadGrano calidad) {
        return ResponseEntity.ok(cosechaService.filtrarPorCalidad(calidad));
    }

    @GetMapping("/rango")
    public ResponseEntity<List<RegistroCosecha>> porRango(
            @RequestParam String inicio,
            @RequestParam String fin) {
        return ResponseEntity.ok(cosechaService.filtrarPorRango(
                LocalDate.parse(inicio), LocalDate.parse(fin)));
    }

    @PostMapping("/parcela/{parcelaId}/producto/{productoId}")
    public ResponseEntity<?> registrar(
            @PathVariable Long parcelaId,
            @PathVariable Long productoId,
            @RequestBody RegistroCosecha datos) {
        try {
            return ResponseEntity.ok(cosechaService.registrarCosecha(parcelaId, productoId, datos));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id,
                                         @RequestBody RegistroCosecha datos) {
        try {
            return ResponseEntity.ok(cosechaService.actualizarCosecha(id, datos));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            cosechaService.eliminarCosecha(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}