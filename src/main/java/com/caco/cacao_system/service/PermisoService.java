package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Permiso;
import com.caco.cacao_system.repository.PermisoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PermisoService {

    private final PermisoRepository permisoRepository;

    public List<Permiso> listarTodos() {
        return permisoRepository.findAllByOrderByCategoriaAscNombreAsc();
    }
}
