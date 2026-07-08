package com.caco.cacao_system.service;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CosechaService {

    private final RegistroCosechaRepository cosechaRepo;
    private final ParcelaRepository parcelaRepo;
    private final ProductoInventarioRepository inventarioRepo;
    private final MovimientoInventarioRepository movimientoRepo;

    // ── LISTAR ─────────────────────────────────────────────

    public List<RegistroCosecha> listarTodos() {
        return cosechaRepo.findAll();
    }

    public List<RegistroCosecha> historialPorParcela(Long parcelaId) {
        return cosechaRepo.findByParcelaIdOrderByFechaCosechaDesc(parcelaId);
    }

    public List<RegistroCosecha> filtrarPorCalidad(CalidadGrano calidad) {
        return cosechaRepo.findByCalidad(calidad);
    }

    public List<RegistroCosecha> filtrarPorRango(LocalDate inicio, LocalDate fin) {
        return cosechaRepo.findByFechaCosechaBetweenOrderByFechaCosechaDesc(inicio, fin);
    }

    public RegistroCosecha obtenerPorId(Long id) {
        return cosechaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de cosecha no encontrado: " + id));
    }

    // ── CREAR ──────────────────────────────────────────────

    @Transactional
    public RegistroCosecha registrarCosecha(Long parcelaId, Long productoId, RegistroCosecha datos) {

        // 1. Validar parcela
        Parcela parcela = parcelaRepo.findById(parcelaId)
                .orElseThrow(() -> new RuntimeException("Parcela no encontrada: " + parcelaId));

        // 2. Validar producto inventario
        ProductoInventario producto = inventarioRepo.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));

        // 3. Generar número de lote automático: #C-2026-001
        String numeroLote = generarNumeroLote();

        // 4. Armar el registro
        datos.setParcela(parcela);
        datos.setProductoInventario(producto);
        datos.setNumeroLote(numeroLote);

        RegistroCosecha guardado = cosechaRepo.save(datos);

        // 5. Sumar al inventario automáticamente
        producto.setStockActual(producto.getStockActual().add(datos.getCantidadKg()));
        inventarioRepo.save(producto);

        // 6. Registrar movimiento en inventario para trazabilidad
        MovimientoInventario movimiento = MovimientoInventario.builder()
                .producto(producto)
                .tipo(TipoMovimiento.ENTRADA)
                .cantidad(datos.getCantidadKg())
                .motivo("Cosecha " + numeroLote + " — " + parcela.getNombre())
                .build();
        movimientoRepo.save(movimiento);

        return guardado;
    }

    // ── ACTUALIZAR ─────────────────────────────────────────

    @Transactional
    public RegistroCosecha actualizarCosecha(Long id, RegistroCosecha datos) {
        RegistroCosecha existente = obtenerPorId(id);

        // Si cambia la cantidad, ajustar inventario
        BigDecimal diferencia = datos.getCantidadKg().subtract(existente.getCantidadKg());
        if (diferencia.compareTo(BigDecimal.ZERO) != 0 && existente.getProductoInventario() != null) {
            ProductoInventario producto = existente.getProductoInventario();
            BigDecimal nuevoStock = producto.getStockActual().add(diferencia);
            if (nuevoStock.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("No se puede reducir: el stock resultante sería negativo");
            }
            producto.setStockActual(nuevoStock);
            inventarioRepo.save(producto);
        }

        existente.setFechaCosecha(datos.getFechaCosecha());
        existente.setCantidadKg(datos.getCantidadKg());
        existente.setCalidad(datos.getCalidad());
        existente.setResponsable(datos.getResponsable());
        existente.setObservaciones(datos.getObservaciones());

        return cosechaRepo.save(existente);
    }

    // ── ELIMINAR ───────────────────────────────────────────

    @Transactional
    public void eliminarCosecha(Long id) {
        RegistroCosecha cosecha = obtenerPorId(id);

        // Revertir stock en inventario
        if (cosecha.getProductoInventario() != null) {
            ProductoInventario producto = cosecha.getProductoInventario();
            BigDecimal nuevoStock = producto.getStockActual().subtract(cosecha.getCantidadKg());
            if (nuevoStock.compareTo(BigDecimal.ZERO) < 0) nuevoStock = BigDecimal.ZERO;
            producto.setStockActual(nuevoStock);
            inventarioRepo.save(producto);
        }

        cosechaRepo.deleteById(id);
    }

    // ── UTIL ───────────────────────────────────────────────

    private String generarNumeroLote() {
        int anio = LocalDate.now().getYear();
        List<RegistroCosecha> todos = cosechaRepo.findAllOrderByIdDesc();
        int siguiente = todos.isEmpty() ? 1 : todos.size() + 1;
        return String.format("#C-%d-%03d", anio, siguiente);
    }
}