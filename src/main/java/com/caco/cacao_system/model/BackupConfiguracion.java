package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "backup_configuracion")
public class BackupConfiguracion {

    public static final String DESACTIVADO = "DESACTIVADO";
    public static final String DIARIO = "DIARIO";
    public static final String SEMANAL = "SEMANAL";
    public static final String MENSUAL = "MENSUAL";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 15)
    private String frecuencia = DESACTIVADO;

    @Column(nullable = false)
    private LocalTime hora = LocalTime.of(20, 30);

    @Column(name = "dia_semana")
    private Integer diaSemana;

    @Column(name = "dia_mes")
    private Integer diaMes;

    @Column(nullable = false)
    private Boolean activo = false;

    @Column(name = "ultimo_periodo", length = 40)
    private String ultimoPeriodo;

    @Column(name = "ultima_ejecucion")
    private LocalDateTime ultimaEjecucion;
}