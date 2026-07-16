package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Cliente;
import com.caco.cacao_system.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public List<Cliente> listarTodos() {
        return clienteService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar")
    public List<Cliente> buscar(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return List.of();
        }
        String term = q.trim();
        List<Cliente> porNombre = clienteService.buscarPorNombre(term);
        List<Cliente> porCedula = clienteService.buscarPorCedula(term);
        List<Cliente> porRuc = clienteService.buscarPorRuc(term);
        Set<Cliente> resultados = new LinkedHashSet<>();
        resultados.addAll(porNombre);
        resultados.addAll(porCedula);
        resultados.addAll(porRuc);
        return new ArrayList<>(resultados);
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
    public ResponseEntity<?> crear(@RequestBody Cliente cliente) {
        if (cliente.getNombre() == null || cliente.getNombre().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre es obligatorio."));
        }
        String error = validarIdentificacion(cliente.getCedula(), cliente.getRuc());
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }
        return ResponseEntity.ok(clienteService.guardar(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Cliente cliente) {
        return clienteService.buscarPorId(id)
                .map(c -> {
                    String error = validarIdentificacion(cliente.getCedula(), cliente.getRuc());
                    if (error != null) {
                        return ResponseEntity.badRequest().body(Map.of("error", error));
                    }
                    cliente.setId(id);
                    return ResponseEntity.ok(clienteService.guardar(cliente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return clienteService.buscarPorId(id)
                .map(c -> {
                    clienteService.eliminar(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
