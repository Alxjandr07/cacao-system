package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    List<Permiso> findAllByOrderByCategoriaAscNombreAsc();
    Optional<Permiso> findByNombre(String nombre);
}
