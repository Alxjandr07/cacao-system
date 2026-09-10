package com.caco.cacao_system.service;

import com.caco.cacao_system.model.BackupConfiguracion;
import com.caco.cacao_system.repository.BackupConfiguracionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.IsoFields;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BackupScheduler {

    private final BackupConfiguracionRepository configuracionRepository;
    private final BackupService backupService;
    private final AuditoriaService auditoriaService;

    @Scheduled(fixedDelay = 30_000, initialDelay = 10_000)
    public void ejecutarProgramados() {
        try {
            List<BackupConfiguracion> configs = configuracionRepository.findAll();
            if (configs.isEmpty()) return;

            BackupConfiguracion cfg = configs.get(0);
            if (!Boolean.TRUE.equals(cfg.getActivo()) || !esMomentoDeEjecutar(cfg)) {
                return;
            }

            BackupService.InfoBackup b = backupService.generar();
            cfg.setUltimoPeriodo(periodoActual(cfg));
            cfg.setUltimaEjecucion(LocalDateTime.now());
            configuracionRepository.save(cfg);

            auditoriaService.registrar("SISTEMA", "RESPALDO", "base_datos", null,
                    "Respaldo programado generado: " + b.nombre() + " (" + b.tamanoBytes() + " bytes)"
                            + " — frecuencia " + cfg.getFrecuencia() + " a las " + cfg.getHora(),
                    "PROGRAMADO");
        } catch (Exception ex) {
            auditoriaService.registrar("SISTEMA", "RESPALDO_FALLIDO", "base_datos", null,
                    "El respaldo programado falló: " + ex.getMessage(),
                    "PROGRAMADO");
        }
    }

    private boolean esMomentoDeEjecutar(BackupConfiguracion cfg) {
        LocalDateTime now = LocalDateTime.now();
        LocalTime hora = cfg.getHora();
        if (hora == null) return false;
        if (now.getHour() != hora.getHour() || now.getMinute() != hora.getMinute()) {
            return false;
        }
        String periodo = periodoActual(cfg);
        if (periodo == null || periodo.equals(cfg.getUltimoPeriodo())) {
            return false;
        }
        return switch (cfg.getFrecuencia()) {
            case BackupConfiguracion.DIARIO -> true;
            case BackupConfiguracion.SEMANAL ->
                    cfg.getDiaSemana() != null && now.getDayOfWeek().getValue() == cfg.getDiaSemana();
            case BackupConfiguracion.MENSUAL ->
                    cfg.getDiaMes() != null && now.getDayOfMonth() == cfg.getDiaMes();
            default -> false;
        };
    }

    private String periodoActual(BackupConfiguracion cfg) {
        LocalDate hoy = LocalDate.now();
        return switch (cfg.getFrecuencia()) {
            case BackupConfiguracion.DIARIO -> hoy.toString();
            case BackupConfiguracion.SEMANAL ->
                    hoy.get(IsoFields.WEEK_BASED_YEAR) + "-S" + hoy.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            case BackupConfiguracion.MENSUAL -> hoy.getYear() + "-" + hoy.getMonthValue();
            default -> null;
        };
    }
}