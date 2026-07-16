package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Proveedor;
import com.caco.cacao_system.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

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
}
