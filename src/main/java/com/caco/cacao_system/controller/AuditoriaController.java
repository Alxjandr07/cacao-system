package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.Auditoria;
import com.caco.cacao_system.service.AuditoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    @GetMapping
    public List<Auditoria> listar(
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) String entidad,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(defaultValue = "500") int limite) {
        return auditoriaService.listar(
                usuario,
                accion,
                entidad,
                parsear(desde),
                parsear(hasta),
                limite);
    }

    private LocalDateTime parsear(String fecha) {
        if (fecha == null || fecha.isBlank()) return null;
        try {
            return LocalDateTime.parse(fecha);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(fecha + "T00:00:00");
            } catch (Exception e2) {
                return null;
            }
        }
    }
}