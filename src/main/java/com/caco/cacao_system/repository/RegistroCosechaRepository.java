package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.CalidadGrano;
import com.caco.cacao_system.model.RegistroCosecha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroCosechaRepository extends JpaRepository<RegistroCosecha, Long> {

    // Historial por parcela ordenado por fecha
    List<RegistroCosecha> findByParcelaIdOrderByFechaCosechaDesc(Long parcelaId);

    // Filtrar por calidad
    List<RegistroCosecha> findByCalidad(CalidadGrano calidad);

    // Cosechas en un rango de fechas
    List<RegistroCosecha> findByFechaCosechaBetweenOrderByFechaCosechaDesc(
            LocalDate inicio, LocalDate fin);

    // Para generar número de lote — obtener el último
    @Query("SELECT r FROM RegistroCosecha r ORDER BY r.id DESC")
    List<RegistroCosecha> findAllOrderByIdDesc();

    // Buscar por número de lote
    Optional<RegistroCosecha> findByNumeroLote(String numeroLote);
}