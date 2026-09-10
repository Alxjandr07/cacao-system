package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Trazabilidad;
import com.caco.cacao_system.model.EstadoLote;
import com.caco.cacao_system.model.RegistroCosecha;
import com.caco.cacao_system.repository.RegistroCosechaRepository;
import com.caco.cacao_system.repository.TrazabilidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrazabilidadService {

    private final TrazabilidadRepository trazabilidadRepository;
    private final RegistroCosechaRepository cosechaRepository;

    public List<Trazabilidad> listarTodas() {
        return trazabilidadRepository.findAll();
    }

    public Optional<Trazabilidad> buscarPorId(Long id) {
        return trazabilidadRepository.findById(id);
    }

    public Optional<Trazabilidad> buscarPorLote(String codigoLote) {
        return trazabilidadRepository.findByCodigoLote(codigoLote);
    }

    public List<Trazabilidad> buscarPorEstado(EstadoLote estado) {
        return trazabilidadRepository.findByEstadoLote(estado);
    }

    public List<Trazabilidad> buscarPorCliente(String nombreCliente) {
        return trazabilidadRepository.findByNombreClienteContainingIgnoreCase(nombreCliente);
    }

    public Trazabilidad guardar(Trazabilidad trazabilidad) {
        return trazabilidadRepository.save(trazabilidad);
    }

    public void eliminar(Long id) {
        trazabilidadRepository.deleteById(id);
    }

    public String generarCodigoLote() {
        long count = trazabilidadRepository.count() + 1;
        return String.format("LOTE-%04d-2026", count);
    }

    public List<Trazabilidad> pendientesDeAsignacion() {
        return trazabilidadRepository.findByTrazabilidadCompletaFalseAndEstadoLoteIn(
                List.of(EstadoLote.VENDIDO, EstadoLote.PARCIAL));
    }

    /**
     * Genera o actualiza la trazabilidad de los lotes cosechados vinculados al
     * producto vendido (reparto FIFO por fecha de cosecha).
     * @return cuántos registros NUEVOS quedaron pendientes de asignar trazabilidad
     */
    @Transactional
    public int registrarVenta(Long productoId, String nombreProducto, double cantidadKg,
                              String numeroFactura, String nombreCliente) {
        List<RegistroCosecha> cosechas =
                cosechaRepository.findByProductoInventarioIdOrderByFechaCosechaAsc(productoId);
        if (cosechas.isEmpty()) return 0;

        double pendiente = cantidadKg;
        int nuevosPendientes = 0;
        LocalDateTime ahora = LocalDateTime.now();

        for (RegistroCosecha c : cosechas) {
            if (pendiente <= 0) break;
            double cosechado = c.getCantidadKg() != null ? c.getCantidadKg().doubleValue() : 0;
            if (cosechado <= 0) continue;

            Trazabilidad t = trazabilidadRepository.findByCodigoLote(c.getNumeroLote()).orElse(null);
            if (t == null) {
                t = new Trazabilidad();
                t.setCodigoLote(c.getNumeroLote());
                t.setFechaRegistro(ahora);
                t.setParcela(c.getParcela() != null ? c.getParcela().getNombre() : null);
                t.setFechaCosecha(c.getFechaCosecha() != null ? c.getFechaCosecha().atStartOfDay() : null);
                t.setCantidadCosechada(cosechado);
                t.setCantidadVendida(0.0);
                t.setProducto(nombreProducto);
                t.setEstadoLote(EstadoLote.PARCIAL);
                t.setTrazabilidadCompleta(false);
                nuevosPendientes++;
            }

            double yaVendida = t.getCantidadVendida() != null ? t.getCantidadVendida() : 0;
            double disponible = cosechado - yaVendida;
            if (disponible <= 0) continue;

            double asignar = Math.min(disponible, pendiente);
            t.setCantidadVendida(yaVendida + asignar);
            pendiente -= asignar;

            t.setNumeroFactura(numeroFactura);
            t.setNombreCliente(nombreCliente);
            t.setFechaVenta(ahora);
            t.setProducto(nombreProducto);
            t.setEstadoLote(t.getCantidadVendida() >= cosechado ? EstadoLote.VENDIDO : EstadoLote.PARCIAL);
            trazabilidadRepository.save(t);
        }
        return nuevosPendientes;
    }
}
