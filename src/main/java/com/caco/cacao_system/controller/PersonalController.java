package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Personal;
import com.caco.cacao_system.service.PersonalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/personal")
@RequiredArgsConstructor
public class PersonalController {

    private final PersonalService personalService;

    @GetMapping
    public List<Personal> listarTodos() {
        return personalService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Personal> buscarPorId(@PathVariable Long id) {
        return personalService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cedula/{cedula}")
    public ResponseEntity<Map<String, Boolean>> verificarCedula(@PathVariable String cedula) {
        boolean existe = personalService.existeCedula(cedula);
        return ResponseEntity.ok(Map.of("existe", existe));
    }

    @GetMapping("/buscar")
    public List<Personal> buscar(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return List.of();
        }
        String term = q.trim();
        Set<Personal> resultados = new LinkedHashSet<>();
        resultados.addAll(personalService.buscarPorNombres(term));
        resultados.addAll(personalService.buscarPorApellidos(term));
        resultados.addAll(personalService.buscarPorCargo(term));
        personalService.buscarPorCedula(term).ifPresent(resultados::add);
        return new ArrayList<>(resultados);
    }

    private String validarPersonal(Personal p, boolean esNuevo) {
        String cedula = p.getCedula();
        if (cedula == null || cedula.isBlank()) return "La cédula es obligatoria.";
        if (!cedula.matches("\\d{10}")) return "La cédula debe tener exactamente 10 dígitos.";
        if (esNuevo && personalService.existeCedula(cedula)) return "La cédula ya está registrada.";

        if (p.getNombres() == null || p.getNombres().isBlank()) return "Los nombres son obligatorios.";
        if (!p.getNombres().matches("[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]+")) return "Los nombres solo permiten letras y espacios.";

        if (p.getApellidos() == null || p.getApellidos().isBlank()) return "Los apellidos son obligatorios.";
        if (!p.getApellidos().matches("[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]+")) return "Los apellidos solo permiten letras y espacios.";

        if (p.getCargo() == null || p.getCargo().isBlank()) return "Debe seleccionarse un cargo.";

        if (p.getTelefono() != null && !p.getTelefono().isEmpty() && !p.getTelefono().matches("\\d{10}")) {
            return "El teléfono debe tener exactamente 10 dígitos.";
        }

        if (p.getEmail() != null && !p.getEmail().isEmpty() && !p.getEmail().matches("^[\\w.-]+@[\\w.-]+\\.\\w{2,}$")) {
            return "El correo debe tener un formato válido.";
        }

        if (p.getDireccion() == null || p.getDireccion().isBlank()) return "La dirección no puede quedar vacía.";

        if (p.getFechaIngreso() != null && p.getFechaIngreso().isAfter(java.time.LocalDate.now())) {
            return "La fecha de ingreso no puede ser mayor a la fecha actual.";
        }

        if (p.getActivo() == null) return "El estado debe seleccionarse.";

        return null;
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Personal personal) {
        String error = validarPersonal(personal, true);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }
        return ResponseEntity.ok(personalService.guardar(personal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Personal personal) {
        return personalService.buscarPorId(id)
                .map(existente -> {
                    if (!existente.getCedula().equals(personal.getCedula())
                            && personalService.existeCedula(personal.getCedula())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "La cédula ya está registrada por otro empleado."));
                    }
                    String error = validarPersonal(personal, false);
                    if (error != null) {
                        return ResponseEntity.badRequest().body(Map.of("error", error));
                    }
                    personal.setId(id);
                    return ResponseEntity.ok(personalService.guardar(personal));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "El empleado no existe.")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (personalService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El empleado no existe."));
        }
        personalService.eliminar(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}/toggle-estado")
    public ResponseEntity<?> toggleEstado(@PathVariable Long id) {
        return personalService.buscarPorId(id)
                .map(p -> {
                    p.setActivo(!p.getActivo());
                    return ResponseEntity.ok((Object) personalService.guardar(p));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "El empleado no existe.")));
    }
}
