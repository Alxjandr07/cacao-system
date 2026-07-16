package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    Optional<Proveedor> findByRuc(String ruc);
    boolean existsByRuc(String ruc);
    List<Proveedor> findByNombreContainingIgnoreCase(String nombre);
    List<Proveedor> findByCiudadContainingIgnoreCase(String ciudad);
    List<Proveedor> findByTipo(String tipo);
    List<Proveedor> findByActivo(Boolean activo);
}
