package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    // Historial de movimientos de un producto específico
    List<MovimientoInventario> findByProductoIdOrderByFechaDesc(Long productoId);
}