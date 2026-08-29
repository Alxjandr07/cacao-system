package com.caco.cacao_system.service;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final ProveedorProductoRepository proveedorProductoRepository;
    private final ProductoInventarioRepository productoRepository;

    public List<Proveedor> listarTodos() {
        return proveedorRepository.findAll();
    }

    public Optional<Proveedor> buscarPorId(Long id) {
        return proveedorRepository.findById(id);
    }

    public Optional<Proveedor> buscarPorRuc(String ruc) {
        return proveedorRepository.findByRuc(ruc);
    }

    public boolean existeRuc(String ruc) {
        return proveedorRepository.existsByRuc(ruc);
    }

    public List<Proveedor> buscarPorNombre(String q) {
        return proveedorRepository.findByNombreContainingIgnoreCase(q);
    }

    public List<Proveedor> buscarPorCiudad(String q) {
        return proveedorRepository.findByCiudadContainingIgnoreCase(q);
    }

    public Proveedor guardar(Proveedor proveedor) {
        return proveedorRepository.save(proveedor);
    }

    public void eliminar(Long id) {
        proveedorRepository.deleteById(id);
    }

    // ── INSUMOS DEL PROVEEDOR (vinculados a inventario) ────────────────

    public List<ProveedorProducto> listarInsumos(Long proveedorId) {
        return proveedorProductoRepository.findByProveedorIdOrderByIdAsc(proveedorId);
    }

    @Transactional
    public ProveedorProducto crearInsumo(Long proveedorId, Map<String, Object> body) {
        Proveedor proveedor = proveedorRepository.findById(proveedorId)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado."));

        String nombre = body.get("nombre") != null ? String.valueOf(body.get("nombre")).trim() : "";
        if (nombre.length() < 3) {
            throw new RuntimeException("El nombre del insumo debe tener al menos 3 caracteres.");
        }

        String unidadMedida = body.get("unidadMedida") != null
                ? String.valueOf(body.get("unidadMedida")).trim() : "unidades";
        if (unidadMedida.isBlank()) unidadMedida = "unidades";

        BigDecimal stockMinimo = BigDecimal.ZERO;
        if (body.get("stockMinimo") != null) {
            try {
                stockMinimo = new BigDecimal(String.valueOf(body.get("stockMinimo")));
            } catch (NumberFormatException ignored) { }
        }

        // 1) Crear (o reutilizar) el producto en inventario tipo INSUMO
        ProductoInventario producto = ProductoInventario.builder()
                .nombre(nombre)
                .tipo(TipoProducto.INSUMO)
                .unidadMedida(unidadMedida)
                .stockActual(BigDecimal.ZERO)
                .stockMinimo(stockMinimo)
                .descripcion("Insumo provisto por " + proveedor.getNombre())
                .build();
        producto = productoRepository.save(producto);

        // 2) Vincularlo al proveedor
        ProveedorProducto insumo = ProveedorProducto.builder()
                .proveedor(proveedor)
                .nombre(nombre)
                .unidadMedida(unidadMedida)
                .stockMinimo(stockMinimo)
                .producto(producto)
                .build();
        return proveedorProductoRepository.save(insumo);
    }

    public void eliminarInsumo(Long insumoId) {
        ProveedorProducto insumo = proveedorProductoRepository.findById(insumoId)
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado."));
        proveedorProductoRepository.delete(insumo);
    }
}
