package com.caco.cacao_system.service;

import com.caco.cacao_system.model.BackupConfiguracion;
import com.caco.cacao_system.repository.BackupConfiguracionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BackupConfiguracionService {

    private static final Set<String> FRECUENCIAS = Set.of(
            BackupConfiguracion.DESACTIVADO,
            BackupConfiguracion.DIARIO,
            BackupConfiguracion.SEMANAL,
            BackupConfiguracion.MENSUAL);

    private final BackupConfiguracionRepository reservaRepository;

    public BackupConfiguracion obtener() {
        List<BackupConfiguracion> todas = reservaRepository.findAll();
        if (!todas.isEmpty()) {
            return todas.get(0);
        }
        BackupConfiguracion porDefecto = new BackupConfiguracion();
        porDefecto.setFrecuencia(BackupConfiguracion.DIARIO);
        porDefecto.setHora(LocalTime.of(20, 30));
        porDefecto.setActivo(true);
        return reservaRepository.save(porDefecto);
    }

    public BackupConfiguracion guardar(String frecuencia, LocalTime hora,
                                       Integer diaSemana, Integer diaMes, boolean activo) {
        if (frecuencia == null || !FRECUENCIAS.contains(frecuencia)) {
            throw new IllegalArgumentException("Frecuencia no válida. Usa DIARIO, SEMANAL, MENSUAL o DESACTIVADO.");
        }
        if (hora == null) {
            throw new IllegalArgumentException("La hora es obligatoria.");
        }
        if (BackupConfiguracion.SEMANAL.equals(frecuencia)) {
            if (diaSemana == null || diaSemana < 1 || diaSemana > 7) {
                throw new IllegalArgumentException("Para la frecuencia semanal debes elegir el día (1=Lunes … 7=Domingo).");
            }
        }
        if (BackupConfiguracion.MENSUAL.equals(frecuencia)) {
            if (diaMes == null || diaMes < 1 || diaMes > 31) {
                throw new IllegalArgumentException("Para la frecuencia mensual debes elegir el día del mes (1-31).");
            }
        }

        boolean estaActiva = activo && !BackupConfiguracion.DESACTIVADO.equals(frecuencia);

        BackupConfiguracion cfg = obtener();
        cfg.setFrecuencia(frecuencia);
        cfg.setHora(hora);
        cfg.setDiaSemana(BackupConfiguracion.SEMANAL.equals(frecuencia) ? diaSemana : null);
        cfg.setDiaMes(BackupConfiguracion.MENSUAL.equals(frecuencia) ? diaMes : null);
        cfg.setActivo(estaActiva);
        // Cada vez que el usuario re-programa, se habilita la siguiente ejecución del periodo.
        cfg.setUltimoPeriodo(null);
        return reservaRepository.save(cfg);
    }
}