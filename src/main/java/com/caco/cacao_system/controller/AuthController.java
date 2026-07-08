package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Usuario;
import com.caco.cacao_system.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciales) {
        String username = credenciales.get("username");
        String password = credenciales.get("password");

        Optional<Usuario> usuario = usuarioService.buscarPorUsername(username);

        if (usuario.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario no encontrado"));
        }

        if (!passwordEncoder.matches(password, usuario.get().getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Contraseña incorrecta"));
        }

        if (!usuario.get().getActivo()) {
            return ResponseEntity.status(403).body(Map.of("error", "Usuario inactivo"));
        }

        return ResponseEntity.ok(Map.of(
            "mensaje", "Login exitoso",
            "username", usuario.get().getUsername(),
            "nombres", usuario.get().getNombres(),
            "apellidos", usuario.get().getApellidos(),
            "rol", usuario.get().getRol().getNombre()
        ));
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Usuario usuario) {
        if (usuarioService.existeUsername(usuario.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username ya existe"));
        }
        if (usuarioService.existeEmail(usuario.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email ya existe"));
        }
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        Usuario nuevo = usuarioService.guardar(usuario);
        return ResponseEntity.ok(Map.of(
            "mensaje", "Usuario registrado exitosamente",
            "id", nuevo.getId(),
            "username", nuevo.getUsername()
        ));
    }
}
