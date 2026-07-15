package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.Factura;
import com.caco.cacao_system.model.EstadoFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    Optional<Factura> findByNumeroFactura(String numeroFactura);
    List<Factura> findByEstado(EstadoFactura estado);
    boolean existsByNumeroFactura(String numeroFactura);
}
