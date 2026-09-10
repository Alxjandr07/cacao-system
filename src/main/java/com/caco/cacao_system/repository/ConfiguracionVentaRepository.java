package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.ConfiguracionVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfiguracionVentaRepository extends JpaRepository<ConfiguracionVenta, Long> {
}
