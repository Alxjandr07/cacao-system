package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Factura;
import com.caco.cacao_system.model.EstadoFactura;
import com.caco.cacao_system.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facturacion")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;

    @GetMapping
    public List<Factura> listarTodas() {
        return facturaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Factura> buscarPorId(@PathVariable Long id) {
        return facturaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/numero/{numero}")
    public ResponseEntity<Factura> buscarPorNumero(@PathVariable String numero) {
        return facturaService.buscarPorNumero(numero)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/estado/{estado}")
    public List<Factura> buscarPorEstado(@PathVariable EstadoFactura estado) {
        return facturaService.buscarPorEstado(estado);
    }

    @GetMapping("/generar-numero")
    public ResponseEntity<Map<String, String>> generarNumero() {
        return ResponseEntity.ok(Map.of("numero", facturaService.generarNumeroFactura()));
    }

    @PostMapping
    public ResponseEntity<Factura> crear(@RequestBody Factura factura) {
        if (factura.getNumeroFactura() == null || factura.getNumeroFactura().isEmpty()) {
            factura.setNumeroFactura(facturaService.generarNumeroFactura());
        }
        return ResponseEntity.ok(facturaService.guardar(factura));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Factura> actualizar(@PathVariable Long id, @RequestBody Factura factura) {
        return facturaService.buscarPorId(id)
                .map(f -> {
                    factura.setId(id);
                    return ResponseEntity.ok(facturaService.guardar(factura));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/anular")
    public ResponseEntity<Factura> anular(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(facturaService.anular(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return facturaService.buscarPorId(id)
                .map(f -> {
                    facturaService.eliminar(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
