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

    @GetMapping("/pendientes")
    public List<Trazabilidad> pendientesDeAsignacion() {
        return trazabilidadService.pendientesDeAsignacion();
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
    public ResponseEntity<Trazabilidad> actualizar(@PathVariable Long id, @RequestBody Trazabilidad datos) {
        return trazabilidadService.buscarPorId(id)
                .map(t -> {
                    if (datos.getCodigoLote() != null) t.setCodigoLote(datos.getCodigoLote());
                    if (datos.getParcela() != null) t.setParcela(datos.getParcela());
                    if (datos.getFechaCosecha() != null) t.setFechaCosecha(datos.getFechaCosecha());
                    if (datos.getCantidadCosechada() != null) t.setCantidadCosechada(datos.getCantidadCosechada());
                    if (datos.getCantidadProcesada() != null) t.setCantidadProcesada(datos.getCantidadProcesada());
                    if (datos.getCantidadVendida() != null) t.setCantidadVendida(datos.getCantidadVendida());
                    if (datos.getNumeroFactura() != null) t.setNumeroFactura(datos.getNumeroFactura());
                    if (datos.getNombreCliente() != null) t.setNombreCliente(datos.getNombreCliente());
                    if (datos.getProducto() != null) t.setProducto(datos.getProducto());
                    if (datos.getInsumosUtilizados() != null) t.setInsumosUtilizados(datos.getInsumosUtilizados());
                    if (datos.getTratamiento() != null) t.setTratamiento(datos.getTratamiento());
                    if (datos.getDiasSecado() != null) t.setDiasSecado(datos.getDiasSecado());
                    if (datos.getSecadoMaquina() != null) t.setSecadoMaquina(datos.getSecadoMaquina());
                    if (datos.getFechaVenta() != null) t.setFechaVenta(datos.getFechaVenta());
                    if (datos.getEstadoLote() != null) t.setEstadoLote(datos.getEstadoLote());
                    if (datos.getObservaciones() != null) t.setObservaciones(datos.getObservaciones());
                    if (datos.getTrazabilidadCompleta() != null)
                        t.setTrazabilidadCompleta(datos.getTrazabilidadCompleta());
                    return ResponseEntity.ok(trazabilidadService.guardar(t));
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
