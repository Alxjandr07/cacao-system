package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Permiso;
import com.caco.cacao_system.model.Usuario;
import com.caco.cacao_system.repository.PermisoRepository;
import com.caco.cacao_system.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PermisoService {

    private final PermisoRepository permisoRepository;
    private final UsuarioRepository usuarioRepository;

    public List<Permiso> listarTodos() {
        return permisoRepository.findAllByOrderByCategoriaAscNombreAsc();
    }

    public List<String> permisosDeUsuario(String username) {
        return usuarioRepository.findByUsername(username)
                .map(u -> u.getRol().getPermisos().stream().map(Permiso::getNombre).toList())
                .orElse(List.of());
    }

    public boolean tienePermiso(String username, String permiso) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isEmpty()) {
            return false;
        }
        Usuario u = usuarioOpt.get();
        if ("ADMIN".equalsIgnoreCase(u.getRol().getNombre())) {
            return true;
        }
        return u.getRol().getPermisos().stream()
                .anyMatch(p -> p.getNombre().equalsIgnoreCase(permiso));
    }

    public boolean tieneAlgunPermiso(String username, String... permisos) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isEmpty()) {
            return false;
        }
        Usuario u = usuarioOpt.get();
        if ("ADMIN".equalsIgnoreCase(u.getRol().getNombre())) {
            return true;
        }
        var nombres = u.getRol().getPermisos().stream()
                .map(p -> p.getNombre().toLowerCase()).toList();
        for (String p : permisos) {
            if (nombres.contains(p.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}
