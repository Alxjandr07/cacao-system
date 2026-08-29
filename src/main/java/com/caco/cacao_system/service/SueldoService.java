package com.caco.cacao_system.service;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
public class SueldoService {

    private final SueldoActividadRepository sueldoRepo;
    private final ActividadPersonalRepository pagoRepo;
    private final PersonalRepository personalRepo;
    private final ActividadMantenimientoRepository actividadRepo;

    // ── SUELDOS POR TIPO (por empleado) ─────────────────────────

    public List<SueldoActividad> listarSueldosDePersonal(Long personalId) {
        return sueldoRepo.findByPersonalIdOrderByTipoAsc(personalId);
    }

    public List<SueldoActividad> listarSueldosDePersonalCompleto(Long personalId) {
        return listarSueldosDePersonal(personalId);
    }

    public Map<String, Object> listarSueldosConResumen(Long personalId) {
        List<SueldoActividad> lista = listarSueldosDePersonal(personalId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sueldos", lista);
        out.put("pendiente", pagoRepo.sumPendientePorPersonal(personalId));
        out.put("pagado", pagoRepo.sumPagadoPorPersonal(personalId));
        return out;
    }

    @Transactional
    public SueldoActividad guardarSueldo(Long personalId, TipoActividad tipo, BigDecimal sueldoDiario) {
        Personal personal = personalRepo.findById(personalId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado."));
        if (tipo == null) throw new RuntimeException("Debe seleccionar un tipo de actividad.");
        if (sueldoDiario == null || sueldoDiario.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El sueldo diario debe ser un valor válido.");
        }
        Optional<SueldoActividad> existente = sueldoRepo.findByPersonalIdAndTipo(personalId, tipo);
        if (existente.isPresent()) {
            existente.get().setSueldoDiario(sueldoDiario);
            return sueldoRepo.save(existente.get());
        }
        SueldoActividad nuevo = SueldoActividad.builder()
                .personal(personal)
                .tipo(tipo)
                .sueldoDiario(sueldoDiario)
                .build();
        return sueldoRepo.save(nuevo);
    }

    public void eliminarSueldo(Long sueldoId) {
        sueldoRepo.deleteById(sueldoId);
    }

    // ── ASIGNACIÓN DE EMPLEADO A ACTIVIDAD (pago/sueldo por actividad) ──

    public List<ActividadPersonal> listarPagos(Long personalId) {
        if (personalId != null) {
            return pagoRepo.findByPersonalIdOrderByCreadoEnDesc(personalId);
        }
        return pagoRepo.findAllByOrderByCreadoEnDesc();
    }

    @Transactional
    public ActividadPersonal asignarEmpleadoAActividad(Long personalId, Long actividadId) {
        Personal personal = personalRepo.findById(personalId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado."));
        if (!Boolean.TRUE.equals(personal.getActivo())) {
            throw new RuntimeException("El empleado está inactivo/despedido y no puede asignarse.");
        }
        ActividadMantenimiento actividad = actividadRepo.findById(actividadId)
                .orElseThrow(() -> new RuntimeException("Actividad no encontrada."));
        if (pagoRepo.existsByPersonalIdAndActividadId(personalId, actividadId)) {
            throw new RuntimeException("Este empleado ya está asignado a esa actividad.");
        }
        TipoActividad tipo = actividad.getTipo();
        BigDecimal monto = sueldoRepo.findByPersonalIdAndTipo(personalId, tipo)
                .map(SueldoActividad::getSueldoDiario)
                .orElseThrow(() -> new RuntimeException(
                        "El empleado no tiene sueldo configurado para la actividad: " + tipo));
        ActividadPersonal ap = ActividadPersonal.builder()
                .personal(personal)
                .actividad(actividad)
                .monto(monto)
                .estadoPago(EstadoPago.PENDIENTE)
                .build();
        return pagoRepo.save(ap);
    }

    @Transactional
    public ActividadPersonal cambiarEstadoPago(Long pagoId, EstadoPago estado, LocalDate fechaPago) {
        ActividadPersonal ap = pagoRepo.findById(pagoId)
                .orElseThrow(() -> new RuntimeException("Registro de pago no encontrado."));
        ap.setEstadoPago(estado);
        if (estado == EstadoPago.PAGADO) {
            ap.setFechaPago(fechaPago != null ? fechaPago : LocalDate.now());
        } else {
            ap.setFechaPago(null);
        }
        return pagoRepo.save(ap);
    }

    public void eliminarPago(Long pagoId) {
        pagoRepo.deleteById(pagoId);
    }

    // ── RESUMEN POR EMPLEADO (para la sección de pagos) ─────────────

    public List<Map<String, Object>> resumenPorEmpleado() {
        List<Personal> personal = personalRepo.findAll();
        java.util.List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (Personal p : personal) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("empleado", p);
            row.put("pendiente", pagoRepo.sumPendientePorPersonal(p.getId()));
            row.put("pagado", pagoRepo.sumPagadoPorPersonal(p.getId()));
            out.add(row);
        }
        return out;
    }
}
