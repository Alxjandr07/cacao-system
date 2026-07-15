package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Trazabilidad;
import com.caco.cacao_system.model.EstadoLote;
import com.caco.cacao_system.repository.TrazabilidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrazabilidadService {

    private final TrazabilidadRepository trazabilidadRepository;

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
}
