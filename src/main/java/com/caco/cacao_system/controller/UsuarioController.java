package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Usuario;
import com.caco.cacao_system.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;

    private boolean esAdmin(String username) {
        return usuarioService.buscarPorUsername(username)
                .map(u -> "ADMIN".equalsIgnoreCase(u.getRol().getNombre()))
                .orElse(false);
    }

    private boolean tieneRolAdmin(Usuario u) {
        return u.getRol() != null && "ADMIN".equalsIgnoreCase(u.getRol().getNombre());
    }

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
    public ResponseEntity<?> crear(@RequestBody Usuario usuario,
                                   @RequestHeader(name = "X-Username", required = false) String operador) {
        if (tieneRolAdmin(usuario) && !esAdmin(operador)) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para crear usuarios administradores."));
        }
        if (usuarioService.existeUsername(usuario.getUsername())) {
            return ResponseEntity.badRequest().build();
        }
        if (usuario.getPassword() != null && !usuario.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        }
        return ResponseEntity.ok(usuarioService.guardar(usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Usuario usuario,
                                        @RequestHeader(name = "X-Username", required = false) String operador) {
        if (!esAdmin(operador)) {
            return usuarioService.buscarPorId(id)
                    .map(existente -> {
                        if (tieneRolAdmin(existente) || tieneRolAdmin(usuario)) {
                            return ResponseEntity.<Usuario>status(403)
                                    .body(null);
                        }
                        return actualizarUsuario(id, usuario);
                    })
                    .orElse(ResponseEntity.notFound().build());
        }
        return actualizarUsuario(id, usuario);
    }

    private ResponseEntity<Usuario> actualizarUsuario(Long id, Usuario usuario) {
        return usuarioService.buscarPorId(id)
                .map(u -> {
                    if (usuario.getPassword() != null && !usuario.getPassword().isBlank()
                            && !usuario.getPassword().startsWith("$2")) {
                        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
                    } else {
                        usuario.setPassword(u.getPassword());
                    }
                    usuario.setId(id);
                    return ResponseEntity.ok(usuarioService.guardar(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id,
                                      @RequestHeader(name = "X-Username", required = false) String operador) {
        return usuarioService.buscarPorId(id)
                .map(u -> {
                    if (tieneRolAdmin(u) && !esAdmin(operador)) {
                        return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para eliminar usuarios administradores."));
                    }
                    usuarioService.eliminar(id);
                    return ResponseEntity.ok(Map.of("success", true));
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