package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Permiso;
import com.caco.cacao_system.service.PermisoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/permisos")
@RequiredArgsConstructor
public class PermisoController {

    private final PermisoService permisoService;

    @GetMapping
    public List<Permiso> listarTodos() {
        return permisoService.listarTodos();
    }
}
