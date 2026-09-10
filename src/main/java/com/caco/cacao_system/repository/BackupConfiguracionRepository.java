package com.caco.cacao_system.repository;

import com.caco.cacao_system.model.BackupConfiguracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BackupConfiguracionRepository extends JpaRepository<BackupConfiguracion, Long> {
}