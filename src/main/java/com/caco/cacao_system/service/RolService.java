package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Permiso;
import com.caco.cacao_system.model.Rol;
import com.caco.cacao_system.repository.PermisoRepository;
import com.caco.cacao_system.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RolService {

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;

    public List<Rol> listarTodos() {
        return rolRepository.findAll();
    }

    public Optional<Rol> buscarPorId(Long id) {
        return rolRepository.findById(id);
    }

    public Optional<Rol> buscarPorNombre(String nombre) {
        return rolRepository.findByNombre(nombre);
    }

    public Rol guardar(Rol rol) {
        if (rol.getPermisos() != null && !rol.getPermisos().isEmpty()) {
            Set<Long> ids = rol.getPermisos().stream()
                .map(Permiso::getId)
                .collect(Collectors.toSet());
            List<Permiso> permisosExistentes = permisoRepository.findAllById(ids);
            rol.setPermisos(permisosExistentes.stream().collect(Collectors.toSet()));
        }
        return rolRepository.save(rol);
    }

    public void eliminar(Long id) {
        rolRepository.deleteById(id);
    }
}