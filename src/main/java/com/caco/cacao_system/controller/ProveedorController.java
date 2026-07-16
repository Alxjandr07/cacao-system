package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Proveedor;
import com.caco.cacao_system.service.ProveedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

    private final ProveedorService proveedorService;

    @GetMapping
    public List<Proveedor> listarTodos() {
        return proveedorService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proveedor> buscarPorId(@PathVariable Long id) {
        return proveedorService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ruc/{ruc}")
    public ResponseEntity<Map<String, Boolean>> verificarRuc(@PathVariable String ruc) {
        boolean existe = proveedorService.existeRuc(ruc);
        return ResponseEntity.ok(Map.of("existe", existe));
    }

    @GetMapping("/buscar")
    public List<Proveedor> buscar(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return List.of();
        }
        String term = q.trim();
        Set<Proveedor> resultados = new LinkedHashSet<>();
        resultados.addAll(proveedorService.buscarPorNombre(term));
        resultados.addAll(proveedorService.buscarPorCiudad(term));
        proveedorService.buscarPorRuc(term).ifPresent(resultados::add);
        return new ArrayList<>(resultados);
    }

    private String validarProveedor(Proveedor p, boolean esNuevo) {
        String ruc = p.getRuc();
        if (ruc == null || ruc.isBlank()) return "El RUC es obligatorio.";
        if (!ruc.matches("\\d{13}")) return "El RUC debe tener exactamente 13 dígitos.";
        if (esNuevo && proveedorService.existeRuc(ruc)) return "El RUC ya está registrado.";

        if (p.getNombre() == null || p.getNombre().isBlank()) return "El nombre o razón social es obligatorio.";

        if (p.getTelefono() != null && !p.getTelefono().isEmpty() && !p.getTelefono().matches("\\d{10}")) {
            return "El teléfono debe tener exactamente 10 dígitos.";
        }

        if (p.getEmail() != null && !p.getEmail().isEmpty() && !p.getEmail().matches("^[\\w.-]+@[\\w.-]+\\.\\w{2,}$")) {
            return "El correo debe tener un formato válido.";
        }

        if (p.getDireccion() == null || p.getDireccion().isBlank()) return "La dirección es obligatoria.";
        if (p.getCiudad() == null || p.getCiudad().isBlank()) return "La ciudad es obligatoria.";
        if (p.getTipo() == null || p.getTipo().isBlank()) return "Debe seleccionarse un tipo de proveedor.";
        if (p.getActivo() == null) return "Debe seleccionarse un estado.";

        return null;
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Proveedor proveedor) {
        String error = validarProveedor(proveedor, true);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }
        return ResponseEntity.ok(proveedorService.guardar(proveedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Proveedor proveedor) {
        return proveedorService.buscarPorId(id)
                .map(existente -> {
                    if (!existente.getRuc().equals(proveedor.getRuc())
                            && proveedorService.existeRuc(proveedor.getRuc())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "El RUC ya está registrado por otro proveedor."));
                    }
                    String error = validarProveedor(proveedor, false);
                    if (error != null) {
                        return ResponseEntity.badRequest().body(Map.of("error", error));
                    }
                    proveedor.setId(id);
                    return ResponseEntity.ok(proveedorService.guardar(proveedor));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "El proveedor no existe.")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (proveedorService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El proveedor no existe."));
        }
        proveedorService.eliminar(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}/toggle-estado")
    public ResponseEntity<?> toggleEstado(@PathVariable Long id) {
        return proveedorService.buscarPorId(id)
                .map(p -> {
                    p.setActivo(!p.getActivo());
                    return ResponseEntity.ok((Object) proveedorService.guardar(p));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "El proveedor no existe.")));
    }
}
