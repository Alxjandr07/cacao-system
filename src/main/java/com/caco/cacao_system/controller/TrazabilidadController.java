package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Trazabilidad;
import com.caco.cacao_system.model.EstadoLote;
import com.caco.cacao_system.service.TrazabilidadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trazabilidad")
@RequiredArgsConstructor
public class TrazabilidadController {

    private final TrazabilidadService trazabilidadService;

    @GetMapping
    public List<Trazabilidad> listarTodas() {
        return trazabilidadService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trazabilidad> buscarPorId(@PathVariable Long id) {
        return trazabilidadService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lote/{codigoLote}")
    public ResponseEntity<Trazabilidad> buscarPorLote(@PathVariable String codigoLote) {
        return trazabilidadService.buscarPorLote(codigoLote)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/estado/{estado}")
    public List<Trazabilidad> buscarPorEstado(@PathVariable EstadoLote estado) {
        return trazabilidadService.buscarPorEstado(estado);
    }

    @GetMapping("/cliente/{nombre}")
    public List<Trazabilidad> buscarPorCliente(@PathVariable String nombre) {
        return trazabilidadService.buscarPorCliente(nombre);
    }

    @GetMapping("/generar-codigo")
    public ResponseEntity<Map<String, String>> generarCodigo() {
        return ResponseEntity.ok(Map.of("codigo", trazabilidadService.generarCodigoLote()));
    }

    @PostMapping
    public ResponseEntity<Trazabilidad> crear(@RequestBody Trazabilidad trazabilidad) {
        if (trazabilidad.getCodigoLote() == null || trazabilidad.getCodigoLote().isEmpty()) {
            trazabilidad.setCodigoLote(trazabilidadService.generarCodigoLote());
        }
        return ResponseEntity.ok(trazabilidadService.guardar(trazabilidad));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trazabilidad> actualizar(@PathVariable Long id, @RequestBody Trazabilidad trazabilidad) {
        return trazabilidadService.buscarPorId(id)
                .map(t -> {
                    trazabilidad.setId(id);
                    return ResponseEntity.ok(trazabilidadService.guardar(trazabilidad));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return trazabilidadService.buscarPorId(id)
                .map(t -> {
                    trazabilidadService.eliminar(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
