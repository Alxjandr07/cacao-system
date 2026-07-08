package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.ActividadMantenimiento;
import com.caco.cacao_system.model.EstadoActividad;
import com.caco.cacao_system.model.TipoActividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActividadMantenimientoRepository extends JpaRepository<ActividadMantenimiento, Long> {

    // Historial completo de una parcela ordenado por fecha
    List<ActividadMantenimiento> findByParcelaIdOrderByFechaProgramadaDesc(Long parcelaId);

    // Filtrar por estado
    List<ActividadMantenimiento> findByEstado(EstadoActividad estado);

    // Filtrar por tipo
    List<ActividadMantenimiento> findByTipo(TipoActividad tipo);

    // Actividades pendientes con fecha vencida (para alertas)
    @Query("SELECT a FROM ActividadMantenimiento a WHERE a.estado = 'PENDIENTE' AND a.fechaProgramada < :hoy")
    List<ActividadMantenimiento> findActividadesVencidas(LocalDate hoy);
}