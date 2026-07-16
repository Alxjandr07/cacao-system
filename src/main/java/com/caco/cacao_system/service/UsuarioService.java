package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Usuario;
import com.caco.cacao_system.repository.UsuarioRepository;
import com.caco.cacao_system.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Optional<Usuario> buscarPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    public Optional<Usuario> buscarPorUsername(String username) {
        return usuarioRepository.findByUsername(username);
    }

    public Usuario guardar(Usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    public void eliminar(Long id) {
        usuarioRepository.deleteById(id);
    }

    public boolean existeUsername(String username) {
        return usuarioRepository.existsByUsername(username);
    }

    public boolean existeEmail(String email) {
        return usuarioRepository.existsByEmail(email);
    }

    public boolean validarContrasenaActual(Long id, String password) {
        return usuarioRepository.findById(id)
                .map(u -> u.getPassword().equals(password))
                .orElse(false);
    }

    public boolean cambiarContrasena(Long id, String nuevaPassword) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    u.setPassword(nuevaPassword);
                    usuarioRepository.save(u);
                    return true;
                })
                .orElse(false);
    }
}