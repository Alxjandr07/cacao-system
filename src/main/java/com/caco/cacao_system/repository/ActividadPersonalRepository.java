package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.ActividadPersonal;
import com.caco.cacao_system.model.EstadoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ActividadPersonalRepository extends JpaRepository<ActividadPersonal, Long> {
    List<ActividadPersonal> findByPersonalIdOrderByCreadoEnDesc(Long personalId);
    List<ActividadPersonal> findByActividadIdOrderByCreadoEnDesc(Long actividadId);
    boolean existsByPersonalIdAndActividadId(Long personalId, Long actividadId);
    List<ActividadPersonal> findByEstadoPagoOrderByCreadoEnDesc(EstadoPago estadoPago);

    @Query("SELECT COALESCE(SUM(ap.monto), 0) FROM ActividadPersonal ap WHERE ap.personal.id = :personalId AND ap.estadoPago = com.caco.cacao_system.model.EstadoPago.PENDIENTE")
    BigDecimal sumPendientePorPersonal(Long personalId);

    @Query("SELECT COALESCE(SUM(ap.monto), 0) FROM ActividadPersonal ap WHERE ap.personal.id = :personalId AND ap.estadoPago = com.caco.cacao_system.model.EstadoPago.PAGADO")
    BigDecimal sumPagadoPorPersonal(Long personalId);

    List<ActividadPersonal> findAllByOrderByCreadoEnDesc();

    void deleteByActividadId(Long actividadId);
    void deleteByPersonalId(Long personalId);
}
