package com.caco.cacao_system.service;

import com.caco.cacao_system.model.ConfiguracionVenta;
import com.caco.cacao_system.repository.ConfiguracionVentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ConfiguracionVentaService {

    private final ConfiguracionVentaRepository repository;

    public ConfiguracionVenta obtener() {
        return repository.findById(1L).orElseGet(() -> repository.save(new ConfiguracionVenta()));
    }

    public ConfiguracionVenta actualizar(BigDecimal ivaPorcentaje, Boolean usarPrecioBolsa,
                                         BigDecimal precioBolsa) {
        ConfiguracionVenta c = obtener();

        if (ivaPorcentaje != null) {
            if (ivaPorcentaje.compareTo(BigDecimal.ZERO) < 0
                    || ivaPorcentaje.compareTo(new BigDecimal("100")) > 0) {
                throw new RuntimeException("El IVA debe estar entre 0 y 100");
            }
            c.setIvaPorcentaje(ivaPorcentaje);
        }
        if (usarPrecioBolsa != null) {
            c.setUsarPrecioBolsa(usarPrecioBolsa);
        }
        if (precioBolsa != null) {
            if (precioBolsa.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("El precio de bolsa debe ser mayor a 0");
            }
            if (c.getPrecioBolsa() == null || c.getPrecioBolsa().compareTo(precioBolsa) != 0) {
                c.setPrecioBolsa(precioBolsa);
                c.setFechaPrecioBolsa(LocalDate.now());
            }
        }
        if (Boolean.TRUE.equals(c.getUsarPrecioBolsa()) && c.getPrecioBolsa() == null) {
            throw new RuntimeException("Define el precio de bolsa para activar el modo bolsa");
        }
        c.setActualizadoEn(LocalDateTime.now());
        return repository.save(c);
    }
}
