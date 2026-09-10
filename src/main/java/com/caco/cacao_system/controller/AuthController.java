package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Usuario;
import com.caco.cacao_system.service.AuditoriaService;
import com.caco.cacao_system.service.PermisoService;
import com.caco.cacao_system.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final PermisoService permisoService;
    private final AuditoriaService auditoriaService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciales, HttpServletRequest request) {
        String username = credenciales.get("username");
        String password = credenciales.get("password");

        Optional<Usuario> usuario = usuarioService.buscarPorUsername(username);

        if (usuario.isEmpty()) {
            auditoriaService.registrar(username, "LOGIN_FALLIDO", "auth", null,
                    "Intento de inicio de sesión con usuario inexistente: " + username,
                    AuditoriaService.ipDe(request));
            return ResponseEntity.status(401).body(Map.of("error", "Usuario no encontrado"));
        }

        if (!passwordEncoder.matches(password, usuario.get().getPassword())) {
            auditoriaService.registrar(username, "LOGIN_FALLIDO", "auth", null,
                    "Contraseña incorrecta para el usuario: " + username,
                    AuditoriaService.ipDe(request));
            return ResponseEntity.status(401).body(Map.of("error", "Contraseña incorrecta"));
        }

        if (!usuario.get().getActivo()) {
            auditoriaService.registrar(username, "LOGIN_FALLIDO", "auth", usuario.get().getId(),
                    "Intento de inicio de sesión con usuario inactivo: " + username,
                    AuditoriaService.ipDe(request));
            return ResponseEntity.status(403).body(Map.of("error", "Usuario inactivo"));
        }

        auditoriaService.registrar(username, "LOGIN", "auth", usuario.get().getId(),
                "Inicio de sesión exitoso: " + username,
                AuditoriaService.ipDe(request));

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("mensaje", "Login exitoso");
        response.put("username", usuario.get().getUsername());
        response.put("nombres", usuario.get().getNombres());
        response.put("apellidos", usuario.get().getApellidos());
        response.put("rol", usuario.get().getRol().getNombre());
        response.put("permisos", permisoService.permisosDeUsuario(usuario.get().getUsername()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) Map<String, String> body,
                                    HttpServletRequest request) {
        String username = body != null ? body.get("username") : null;
        auditoriaService.registrar(username, "LOGOUT", "auth", null,
                "Cierre de sesión: " + username,
                AuditoriaService.ipDe(request));
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada"));
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
