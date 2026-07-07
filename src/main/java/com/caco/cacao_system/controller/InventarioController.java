package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.MovimientoInventario;
import com.caco.cacao_system.model.ProductoInventario;
import com.caco.cacao_system.model.TipoMovimiento;
import com.caco.cacao_system.model.TipoProducto;
import com.caco.cacao_system.service.InventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventario")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InventarioController {

    private final InventarioService inventarioService;

    // ── PRODUCTOS ──────────────────────────────────────────────

    @GetMapping("/productos")
    public ResponseEntity<List<ProductoInventario>> listarTodos() {
        return ResponseEntity.ok(inventarioService.listarTodos());
    }

    @GetMapping("/productos/tipo/{tipo}")
    public ResponseEntity<List<ProductoInventario>> listarPorTipo(@PathVariable TipoProducto tipo) {
        return ResponseEntity.ok(inventarioService.listarPorTipo(tipo));
    }

    @GetMapping("/productos/buscar")
    public ResponseEntity<List<ProductoInventario>> buscar(@RequestParam String nombre) {
        return ResponseEntity.ok(inventarioService.buscarPorNombre(nombre));
    }

    @GetMapping("/productos/{id}")
    public ResponseEntity<ProductoInventario> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(inventarioService.obtenerPorId(id));
    }

    @PostMapping("/productos")
    public ResponseEntity<ProductoInventario> crear(@RequestBody ProductoInventario producto) {
        return ResponseEntity.ok(inventarioService.crearProducto(producto));
    }

    @PutMapping("/productos/{id}")
    public ResponseEntity<ProductoInventario> actualizar(@PathVariable Long id,
                                                          @RequestBody ProductoInventario datos) {
        return ResponseEntity.ok(inventarioService.actualizarProducto(id, datos));
    }

    @DeleteMapping("/productos/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        inventarioService.eliminarProducto(id);
        return ResponseEntity.noContent().build();
    }

    // ── ALERTAS ────────────────────────────────────────────────

    @GetMapping("/alertas")
    public ResponseEntity<List<ProductoInventario>> alertas() {
        return ResponseEntity.ok(inventarioService.obtenerAlertas());
    }

    // ── MOVIMIENTOS ────────────────────────────────────────────

    @PostMapping("/movimientos")
    public ResponseEntity<?> registrarMovimiento(@RequestBody Map<String, String> body) {
        try {
            Long productoId = Long.parseLong(body.get("productoId"));
            TipoMovimiento tipo = TipoMovimiento.valueOf(body.get("tipo"));
            BigDecimal cantidad = new BigDecimal(body.get("cantidad"));
            String motivo = body.get("motivo");

            MovimientoInventario resultado = inventarioService
                    .registrarMovimiento(productoId, tipo, cantidad, motivo);

            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/movimientos/{productoId}")
    public ResponseEntity<List<MovimientoInventario>> historial(@PathVariable Long productoId) {
        return ResponseEntity.ok(inventarioService.historialPorProducto(productoId));
    }
}