package com.caco.cacao_system.service;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final ProductoInventarioRepository productoRepo;
    private final MovimientoInventarioRepository movimientoRepo;

    // ── PRODUCTOS ──────────────────────────────────────────────

    public List<ProductoInventario> listarTodos() {
        return productoRepo.findAll();
    }

    public List<ProductoInventario> listarPorTipo(TipoProducto tipo) {
        return productoRepo.findByTipo(tipo);
    }

    public List<ProductoInventario> buscarPorNombre(String nombre) {
        return productoRepo.findByNombreContainingIgnoreCase(nombre);
    }

    public ProductoInventario obtenerPorId(Long id) {
        return productoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
    }

    public ProductoInventario crearProducto(ProductoInventario producto) {
        return productoRepo.save(producto);
    }

    public ProductoInventario actualizarProducto(Long id, ProductoInventario datos) {
        ProductoInventario existente = obtenerPorId(id);
        existente.setNombre(datos.getNombre());
        existente.setTipo(datos.getTipo());
        existente.setUnidadMedida(datos.getUnidadMedida());
        existente.setStockMinimo(datos.getStockMinimo());
        existente.setDescripcion(datos.getDescripcion());
        return productoRepo.save(existente);
    }

    public void eliminarProducto(Long id) {
        productoRepo.deleteById(id);
    }

    // ── ALERTAS ────────────────────────────────────────────────

    public List<ProductoInventario> obtenerAlertas() {
        return productoRepo.findProductosBajoStock();
    }

    // ── MOVIMIENTOS ────────────────────────────────────────────

    @Transactional
    public MovimientoInventario registrarMovimiento(Long productoId,
                                                    TipoMovimiento tipo,
                                                    BigDecimal cantidad,
                                                    String motivo) {
        ProductoInventario producto = obtenerPorId(productoId);

        if (tipo == TipoMovimiento.SALIDA) {
            if (producto.getStockActual().compareTo(cantidad) < 0) {
                throw new RuntimeException("Stock insuficiente. Disponible: "
                        + producto.getStockActual() + " " + producto.getUnidadMedida());
            }
            producto.setStockActual(producto.getStockActual().subtract(cantidad));
        } else {
            producto.setStockActual(producto.getStockActual().add(cantidad));
        }

        productoRepo.save(producto);

        MovimientoInventario movimiento = MovimientoInventario.builder()
                .producto(producto)
                .tipo(tipo)
                .cantidad(cantidad)
                .motivo(motivo)
                .build();

        return movimientoRepo.save(movimiento);
    }

    public List<MovimientoInventario> historialPorProducto(Long productoId) {
        return movimientoRepo.findByProductoIdOrderByFechaDesc(productoId);
    }
}