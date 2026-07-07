package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.ProductoInventario;
import com.caco.cacao_system.model.TipoProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoInventarioRepository extends JpaRepository<ProductoInventario, Long> {

    // Filtrar por tipo (CACAO o INSUMO)
    List<ProductoInventario> findByTipo(TipoProducto tipo);

    // Productos con stock por debajo del mínimo → alerta
    @Query("SELECT p FROM ProductoInventario p WHERE p.stockActual <= p.stockMinimo")
    List<ProductoInventario> findProductosBajoStock();

    // Buscar por nombre (búsqueda parcial)
    List<ProductoInventario> findByNombreContainingIgnoreCase(String nombre);
}