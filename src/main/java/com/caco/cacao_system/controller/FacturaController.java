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

    private String validarIdentificacion(String cedula, String ruc) {
        if (cedula != null && !cedula.isEmpty() && !cedula.matches("\\d{10}")) {
            return "La cédula debe tener exactamente 10 dígitos.";
        }
        if (ruc != null && !ruc.isEmpty() && !ruc.matches("\\d{13}")) {
            return "El RUC debe tener exactamente 13 dígitos.";
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Factura factura) {
        String error = validarIdentificacion(factura.getCedulaCliente(), factura.getRucCliente());
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }
        if (factura.getNumeroFactura() == null || factura.getNumeroFactura().isEmpty()) {
            factura.setNumeroFactura(facturaService.generarNumeroFactura());
        }
        return ResponseEntity.ok(facturaService.guardar(factura));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Factura factura) {
        return facturaService.buscarPorId(id)
                .map(f -> {
                    String error = validarIdentificacion(factura.getCedulaCliente(), factura.getRucCliente());
                    if (error != null) {
                        return ResponseEntity.badRequest().body(Map.of("error", error));
                    }
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
