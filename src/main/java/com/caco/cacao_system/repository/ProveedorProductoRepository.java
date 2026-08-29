package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.ProveedorProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProveedorProductoRepository extends JpaRepository<ProveedorProducto, Long> {

    List<ProveedorProducto> findByProveedorIdOrderByIdAsc(Long proveedorId);
}