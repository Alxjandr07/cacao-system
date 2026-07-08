package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.service.CultivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cultivo")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CultivoController {

    private final CultivoService cultivoService;

    // ── PARCELAS ───────────────────────────────────────────

    @GetMapping("/parcelas")
    public ResponseEntity<List<Parcela>> listarParcelas() {
        return ResponseEntity.ok(cultivoService.listarParcelas());
    }

    @GetMapping("/parcelas/{id}")
    public ResponseEntity<Parcela> obtenerParcela(@PathVariable Long id) {
        return ResponseEntity.ok(cultivoService.obtenerParcelaPorId(id));
    }

    @GetMapping("/parcelas/buscar")
    public ResponseEntity<List<Parcela>> buscarParcelas(@RequestParam String nombre) {
        return ResponseEntity.ok(cultivoService.buscarParcelas(nombre));
    }

    @PostMapping("/parcelas")
    public ResponseEntity<Parcela> crearParcela(@RequestBody Parcela parcela) {
        return ResponseEntity.ok(cultivoService.crearParcela(parcela));
    }

    @PutMapping("/parcelas/{id}")
    public ResponseEntity<Parcela> actualizarParcela(@PathVariable Long id,
                                                      @RequestBody Parcela datos) {
        return ResponseEntity.ok(cultivoService.actualizarParcela(id, datos));
    }

    @DeleteMapping("/parcelas/{id}")
    public ResponseEntity<Void> eliminarParcela(@PathVariable Long id) {
        cultivoService.eliminarParcela(id);
        return ResponseEntity.noContent().build();
    }

    // ── ACTIVIDADES ────────────────────────────────────────

    @GetMapping("/actividades")
    public ResponseEntity<List<ActividadMantenimiento>> listarActividades() {
        return ResponseEntity.ok(cultivoService.listarActividades());
    }

    @GetMapping("/actividades/parcela/{parcelaId}")
    public ResponseEntity<List<ActividadMantenimiento>> historialPorParcela(
            @PathVariable Long parcelaId) {
        return ResponseEntity.ok(cultivoService.historialPorParcela(parcelaId));
    }

    @GetMapping("/actividades/estado/{estado}")
    public ResponseEntity<List<ActividadMantenimiento>> porEstado(
            @PathVariable EstadoActividad estado) {
        return ResponseEntity.ok(cultivoService.listarPorEstado(estado));
    }

    @GetMapping("/actividades/vencidas")
    public ResponseEntity<List<ActividadMantenimiento>> vencidas() {
        return ResponseEntity.ok(cultivoService.actividadesVencidas());
    }

    @PostMapping("/actividades/parcela/{parcelaId}")
    public ResponseEntity<?> crearActividad(@PathVariable Long parcelaId,
                                             @RequestBody ActividadMantenimiento datos) {
        try {
            return ResponseEntity.ok(cultivoService.crearActividad(parcelaId, datos));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/actividades/{id}")
    public ResponseEntity<?> actualizarActividad(@PathVariable Long id,
                                                  @RequestBody ActividadMantenimiento datos) {
        try {
            return ResponseEntity.ok(cultivoService.actualizarActividad(id, datos));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/actividades/{id}")
    public ResponseEntity<Void> eliminarActividad(@PathVariable Long id) {
        cultivoService.eliminarActividad(id);
        return ResponseEntity.noContent().build();
    }
}