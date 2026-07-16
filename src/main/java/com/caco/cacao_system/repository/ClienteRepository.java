package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByNombreContainingIgnoreCase(String nombre);
    List<Cliente> findByCedulaContainingIgnoreCase(String cedula);
    List<Cliente> findByRucContainingIgnoreCase(String ruc);
    List<Cliente> findByDireccionContainingIgnoreCase(String direccion);
}
