package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "configuracion_venta")
public class ConfiguracionVenta {

    @Id
    private Long id = 1L;

    @Column(name = "iva_porcentaje", nullable = false, precision = 5, scale = 2)
    private BigDecimal ivaPorcentaje = new BigDecimal("15");

    @Column(name = "usar_precio_bolsa", nullable = false)
    private Boolean usarPrecioBolsa = false;

    @Column(name = "precio_bolsa", precision = 10, scale = 2)
    private BigDecimal precioBolsa;

    @Column(name = "fecha_precio_bolsa")
    private LocalDate fechaPrecioBolsa;

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn = LocalDateTime.now();
}
