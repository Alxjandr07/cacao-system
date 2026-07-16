package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Cliente;
import com.caco.cacao_system.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public List<Cliente> buscarPorNombre(String q) {
        return clienteRepository.findByNombreContainingIgnoreCase(q);
    }

    public List<Cliente> buscarPorCedula(String q) {
        return clienteRepository.findByCedulaContainingIgnoreCase(q);
    }

    public List<Cliente> buscarPorRuc(String q) {
        return clienteRepository.findByRucContainingIgnoreCase(q);
    }

    public Cliente guardar(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public void eliminar(Long id) {
        clienteRepository.deleteById(id);
    }
}
