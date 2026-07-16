package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Usuario;
import com.caco.cacao_system.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public List<Usuario> listarTodos() {
        return usuarioService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Long id) {
        return usuarioService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Usuario> crear(@RequestBody Usuario usuario) {
        if (usuarioService.existeUsername(usuario.getUsername())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(usuarioService.guardar(usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(@PathVariable Long id, @RequestBody Usuario usuario) {
        return usuarioService.buscarPorId(id)
                .map(u -> {
                    usuario.setId(id);
                    return ResponseEntity.ok(usuarioService.guardar(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return usuarioService.buscarPorId(id)
                .map(u -> {
                    usuarioService.eliminar(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cambiar-contrasena")
    public ResponseEntity<?> cambiarContrasena(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String actual = body.get("contrasenaActual");
        String nueva = body.get("nuevaContrasena");
        String confirmacion = body.get("confirmarContrasena");

        if (actual == null || nueva == null || confirmacion == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Todos los campos son obligatorios."));
        }

        if (!usuarioService.validarContrasenaActual(id, actual)) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña actual no es correcta."));
        }

        if (nueva.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "La nueva contraseña debe tener mínimo 8 caracteres."));
        }

        if (!nueva.matches(".*[a-zA-Z].*") || !nueva.matches(".*\\d.*")) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe contener letras y números."));
        }

        if (nueva.equals(actual)) {
            return ResponseEntity.badRequest().body(Map.of("error", "La nueva contraseña no puede ser igual a la anterior."));
        }

        if (!nueva.equals(confirmacion)) {
            return ResponseEntity.badRequest().body(Map.of("error", "La confirmación no coincide."));
        }

        if (usuarioService.cambiarContrasena(id, nueva)) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado."));
    }
}