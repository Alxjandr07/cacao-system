package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.Parcela;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParcelaRepository extends JpaRepository<Parcela, Long> {

    // Buscar por nombre parcial
    List<Parcela> findByNombreContainingIgnoreCase(String nombre);

    // Buscar por responsable
    List<Parcela> findByResponsableContainingIgnoreCase(String responsable);
}