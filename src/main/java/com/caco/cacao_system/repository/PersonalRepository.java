package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.Personal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalRepository extends JpaRepository<Personal, Long> {
    Optional<Personal> findByCedula(String cedula);
    boolean existsByCedula(String cedula);
    List<Personal> findByNombresContainingIgnoreCase(String nombres);
    List<Personal> findByApellidosContainingIgnoreCase(String apellidos);
    List<Personal> findByCargoContainingIgnoreCase(String cargo);
    List<Personal> findByActivo(Boolean activo);
}
