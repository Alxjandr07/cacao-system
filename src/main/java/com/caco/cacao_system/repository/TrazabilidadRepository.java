package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.Trazabilidad;
import com.caco.cacao_system.model.EstadoLote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrazabilidadRepository extends JpaRepository<Trazabilidad, Long> {
    Optional<Trazabilidad> findByCodigoLote(String codigoLote);
    List<Trazabilidad> findByEstadoLote(EstadoLote estadoLote);
    List<Trazabilidad> findByNombreClienteContainingIgnoreCase(String nombreCliente);
    boolean existsByCodigoLote(String codigoLote);
}
