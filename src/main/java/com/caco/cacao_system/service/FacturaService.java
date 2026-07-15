package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Factura;
import com.caco.cacao_system.model.EstadoFactura;
import com.caco.cacao_system.repository.FacturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepository;

    public List<Factura> listarTodas() {
        return facturaRepository.findAll();
    }

    public Optional<Factura> buscarPorId(Long id) {
        return facturaRepository.findById(id);
    }

    public Optional<Factura> buscarPorNumero(String numeroFactura) {
        return facturaRepository.findByNumeroFactura(numeroFactura);
    }

    public List<Factura> buscarPorEstado(EstadoFactura estado) {
        return facturaRepository.findByEstado(estado);
    }

    public Factura guardar(Factura factura) {
        if (factura.getDetalles() != null) {
            factura.getDetalles().forEach(d -> d.setFactura(factura));
        }
        return facturaRepository.save(factura);
    }

    public Factura anular(Long id) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
        factura.setEstado(EstadoFactura.ANULADA);
        return facturaRepository.save(factura);
    }

    public void eliminar(Long id) {
        facturaRepository.deleteById(id);
    }

    public String generarNumeroFactura() {
        long count = facturaRepository.count() + 1;
        return String.format("FAC-%04d-2026", count);
    }
}