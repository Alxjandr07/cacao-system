package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.SueldoActividad;
import com.caco.cacao_system.model.TipoActividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SueldoActividadRepository extends JpaRepository<SueldoActividad, Long> {
    List<SueldoActividad> findByPersonalIdOrderByTipoAsc(Long personalId);
    Optional<SueldoActividad> findByPersonalIdAndTipo(Long personalId, TipoActividad tipo);
    boolean existsByPersonalIdAndTipo(Long personalId, TipoActividad tipo);
    void deleteByPersonalId(Long personalId);
}
