package com.caco.cacao_system.service;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CultivoService {

    private final ParcelaRepository parcelaRepo;
    private final ActividadMantenimientoRepository actividadRepo;

    // ── PARCELAS ───────────────────────────────────────────

    public List<Parcela> listarParcelas() {
        return parcelaRepo.findAll();
    }

    public Parcela obtenerParcelaPorId(Long id) {
        return parcelaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcela no encontrada con id: " + id));
    }

    public List<Parcela> buscarParcelas(String nombre) {
        return parcelaRepo.findByNombreContainingIgnoreCase(nombre);
    }

    public Parcela crearParcela(Parcela parcela) {
        return parcelaRepo.save(parcela);
    }

    public Parcela actualizarParcela(Long id, Parcela datos) {
        Parcela existente = obtenerParcelaPorId(id);
        existente.setNombre(datos.getNombre());
        existente.setUbicacion(datos.getUbicacion());
        existente.setHectareas(datos.getHectareas());
        existente.setVariedadCacao(datos.getVariedadCacao());
        existente.setResponsable(datos.getResponsable());
        existente.setObservaciones(datos.getObservaciones());
        return parcelaRepo.save(existente);
    }

    public void eliminarParcela(Long id) {
        parcelaRepo.deleteById(id);
    }

    // ── ACTIVIDADES ────────────────────────────────────────

    public List<ActividadMantenimiento> listarActividades() {
        return actividadRepo.findAll();
    }

    public List<ActividadMantenimiento> historialPorParcela(Long parcelaId) {
        return actividadRepo.findByParcelaIdOrderByFechaProgramadaDesc(parcelaId);
    }

    public List<ActividadMantenimiento> listarPorEstado(EstadoActividad estado) {
        return actividadRepo.findByEstado(estado);
    }

    public List<ActividadMantenimiento> actividadesVencidas() {
        return actividadRepo.findActividadesVencidas(LocalDate.now());
    }

    public ActividadMantenimiento obtenerActividadPorId(Long id) {
        return actividadRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Actividad no encontrada con id: " + id));
    }

    @Transactional
    public ActividadMantenimiento crearActividad(Long parcelaId, ActividadMantenimiento datos) {
        Parcela parcela = obtenerParcelaPorId(parcelaId);
        datos.setParcela(parcela);
        if (datos.getEstado() == null) {
            datos.setEstado(EstadoActividad.PENDIENTE);
        }
        return actividadRepo.save(datos);
    }

    @Transactional
    public ActividadMantenimiento actualizarActividad(Long id, ActividadMantenimiento datos) {
        ActividadMantenimiento existente = obtenerActividadPorId(id);
        existente.setTipo(datos.getTipo());
        existente.setEstado(datos.getEstado());
        existente.setFechaProgramada(datos.getFechaProgramada());
        existente.setFechaRealizada(datos.getFechaRealizada());
        existente.setResponsable(datos.getResponsable());
        existente.setInsumosUsados(datos.getInsumosUsados());
        existente.setObservaciones(datos.getObservaciones());
        return actividadRepo.save(existente);
    }

    public void eliminarActividad(Long id) {
        actividadRepo.deleteById(id);
    }
}